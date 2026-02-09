---
title: "构建高可用系统：可观测性与稳定性保障设计"
date: "2026-02-09"
description: "一套端到端的可观测性与稳定性方案，涵盖 Spring Boot Actuator + Micrometer 指标采集、Prometheus + Grafana 监控告警、Resilience4j 限流熔断降级的完整落地实践。"
tags: ["Architecture", "Spring Boot", "Observability", "Prometheus", "Resilience4j", "Micrometer"]
published: true
---

# 构建高可用系统：可观测性与稳定性保障设计

在分布式系统里，"故障"不是偶发事件，而是常态：网络抖动、下游超时、流量突增、资源耗尽……都可能让服务从"偶尔慢一下"演变为"级联雪崩"。要把系统从"能跑"做到"可运营"，通常需要同时补齐两类能力：

- **可观测性（Observability）**：让系统状态可被外部推断。实践中常说的"三支柱"是指标（Metrics）、日志（Logs）、链路追踪（Traces）。
- **稳定性（Resilience）**：当故障发生时，让系统"可控地变慢/变差"，而不是失控崩溃。常见护栏包括限流、熔断、降级。

本文将以 **Spring Boot 3 + Micrometer + Prometheus + Resilience4j** 为技术栈，完整讲解从"采集 → 存储 → 展示 → 告警"的可观测性链路，以及限流、熔断、降级的稳定性护栏实现。

---

## 1. 整体架构设计

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           用户请求层                                │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      安全认证与限流防护层                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  认证拦截器      │  │  限流器(Rate)    │  │  熔断器(CB)     │    │
│  │ (Spring Security)│  │ (Resilience4j)  │  │ (Resilience4j)  │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        业务逻辑处理层                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  Controller     │  │  Service        │  │  Repository     │    │
│  │  (API接口)      │  │  (业务逻辑)     │  │  (数据访问)     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        可观测性数据采集层                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  基础设施监控    │  │  业务指标监控    │  │  健康检查       │    │
│  │ (JVM/Tomcat等)  │  │ (自定义指标)    │  │ (依赖组件)     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        数据存储与展示层                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  Prometheus     │  │  Grafana        │  │  AlertManager   │    │
│  │ (时序数据库)    │  │ (可视化面板)    │  │ (告警通知)     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件说明

| 组件类别 | 核心组件 | 作用 | 实现方式 |
|:---------|:---------|:-----|:---------|
| **监控采集** | Spring Boot Actuator | 提供生产级监控端点 | Maven依赖 + 配置 |
| **指标处理** | Micrometer | 统一指标收集接口，屏蔽底层差异 | 自动集成 |
| **数据存储** | Prometheus | 时序数据库，拉取并存储指标 | 通过端点拉取数据 |
| **可视化** | Grafana | 监控面板展示 | Prometheus数据源 |
| **限流防护** | Resilience4j | 限流/熔断/降级 | 注解 + 编程式 |

---

## 2. 可观测性落地：指标、健康检查与数据流转

### 2.1 基础设施监控

基础设施指标是"系统层信号"，用来回答最常见的排障问题：是应用自身变慢了，还是资源（CPU/内存/线程/GC）吃紧。

#### 核心监控指标

| 指标类别 | 具体指标 | 说明 |
|:---------|:---------|:-----|
| **JVM指标** | `jvm_memory_used_bytes` | JVM内存使用情况 |
| | `jvm_threads_live_threads` | 活跃线程数 |
| | `jvm_gc_pause_seconds` | GC暂停时间 |
| **Tomcat指标** | `tomcat_sessions_active_current_sessions` | 当前活跃会话数 |
| | `tomcat_global_request_seconds_count` | 请求总数 |
| **系统指标** | `process_cpu_usage` | CPU使用率 |
| | `process_uptime_seconds` | 应用运行时间 |

### 2.2 业务指标监控

业务指标要把系统状态与业务语义绑定起来，让你能从看板上直接读出：成功率是否下降？关键链路是否变慢？

#### 指标设计原则

```
命名规范：<namespace>.<subsystem>.<metric_name>[.<unit>][.<suffix>]

示例：
- app.login.success_count      # 应用级登录成功计数
- db.connection.active_gauge   # 数据库活跃连接数
- api.response.time_timer      # API响应时间统计
```

#### 核心业务指标

| 指标名称 | 类型 | 说明 |
|:---------|:-----|:-----|
| `app.login.success` | Counter | 登录成功次数累计 |
| `app.login.failure` | Counter | 登录失败次数累计 |
| `app.users.online` | Gauge | 当前在线用户数 |
| `app.api.response.time` | Timer | API响应时间分布 |
| `app.file.upload.size` | DistributionSummary | 文件上传大小分布 |

#### 指标收集实现

```java
@Service
@RequiredArgsConstructor
public class BusinessMetricsService {
    
    private final MeterRegistry meterRegistry;
    
    // 登录成功计数器
    private final Counter loginSuccessCounter;
    private final Counter loginFailureCounter;
    
    // API响应时间计时器
    private final Timer apiResponseTimer;
    
    public BusinessMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.loginSuccessCounter = Counter.builder("app.login.success")
            .description("登录成功次数")
            .register(meterRegistry);
        this.loginFailureCounter = Counter.builder("app.login.failure")
            .description("登录失败次数")
            .register(meterRegistry);
        this.apiResponseTimer = Timer.builder("app.api.response.time")
            .description("API响应时间")
            .publishPercentiles(0.5, 0.95, 0.99) // 发布 P50, P95, P99
            .register(meterRegistry);
    }
    
    public void recordLoginSuccess() {
        loginSuccessCounter.increment();
    }
    
    public void recordLoginFailure() {
        loginFailureCounter.increment();
    }
    
    public <T> T recordApiResponseTime(Supplier<T> operation) {
        return apiResponseTimer.record(operation);
    }
}
```

### 2.3 健康检查机制

指标用于"趋势与度量"，健康检查用于"是否可用"。在 Kubernetes 场景里，健康检查直接驱动流量调度与自动恢复。

#### 自定义健康检查

```java
@Component
@RequiredArgsConstructor
public class DatabaseHealthIndicator implements HealthIndicator {
    
    private final DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection connection = dataSource.getConnection()) {
            try (Statement statement = connection.createStatement()) {
                ResultSet rs = statement.executeQuery("SELECT 1");
                if (rs.next()) {
                    return Health.up()
                        .withDetail("database", "PostgreSQL")
                        .withDetail("version", getDatabaseVersion(connection))
                        .build();
                }
            }
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
        return Health.unknown().build();
    }
    
    private String getDatabaseVersion(Connection connection) throws SQLException {
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT version()")) {
            if (rs.next()) {
                return rs.getString(1);
            }
        }
        return "unknown";
    }
}
```

#### 健康检查配置

```yaml
management:
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true
      group:
        readiness:
          include: db,redis,diskSpace
        liveness:
          include: ping
```

---

## 3. 稳定性护栏：限流、熔断与降级

### 3.1 限流：削峰填谷的第一道闸门

限流最常见的目标不是"挡住所有流量"，而是把超出系统承载的部分拒之门外，避免把服务拖入不可恢复的拥塞。

#### 令牌桶算法实现

```
每个时间窗口产生 N 个令牌
请求需要消耗 1 个令牌才能执行
令牌不足时请求被拒绝

时间窗口刷新机制：
T0: 产生10个令牌 ──→ 可处理10个请求
T1: 消耗3个令牌 ──→ 剩余7个令牌
T2: 刷新周期到 ──→ 重新产生10个令牌
```

#### 接口级限流策略

| 接口类型 | 限流配置 | 设计考量 |
|:---------|:---------|:---------|
| 登录接口 | 5次/分钟 | 防止暴力破解，平衡用户体验 |
| 注册接口 | 3次/小时 | 防止恶意注册，控制账户增长 |
| 文件上传 | 3次/秒 | 控制带宽占用，防止DDoS |
| 查询接口 | 10次/秒 | 防止爬虫，保证服务质量 |
| 数据导出 | 10次/小时 | 防止数据泄露，控制资源消耗 |

#### 用户维度限流实现

```java
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private final RateLimiterRegistry rateLimiterRegistry;
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                             HttpServletResponse response, 
                             Object handler) throws Exception {
        // 1. 获取限流 Key (可以是用户ID、IP、或者接口名)
        String limitKey = generateLimitKey(request, handler);
        
        // 2. 获取或创建限流器实例
        RateLimiter rateLimiter = rateLimiterRegistry.rateLimiter(limitKey);
        
        // 3. 尝试获取许可
        boolean permission = rateLimiter.acquirePermission();
        
        if (!permission) {
            // 4. 限流拒绝响应
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"code\": 429, \"message\": \"Too Many Requests\"}");
            return false;
        }
        
        return true;
    }
    
    private String generateLimitKey(HttpServletRequest request, Object handler) {
        // 示例：基于接口名 + IP 限流
        return request.getRequestURI() + ":" + request.getRemoteAddr();
    }
}
```

### 3.2 熔断：隔离故障传播

熔断器的核心思想是"快速失败"：当检测到某个依赖方持续出错或变慢时，主动"断开"对它的调用，直接返回失败或兜底结果，避免调用方被拖死。

#### 熔断器状态机

```
CLOSED ──[失败率>阈值]──→ OPEN ──[等待超时]──→ HALF_OPEN
   ↑                                              │
   └──────────[探测成功]──────────────────────────┘
                                                  │
                                   [探测失败]──→ OPEN
```

#### 熔断配置示例

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        failure-rate-threshold: 50          # 失败率阈值 50%
        slow-call-rate-threshold: 50        # 慢调用占比阈值 50%
        slow-call-duration-threshold: 2s    # 超过 2s 视为慢调用
        wait-duration-in-open-state: 60s    # 熔断后等待 60s 进入半开状态
        sliding-window-size: 100            # 统计窗口大小
        minimum-number-of-calls: 10         # 最小调用次数（防止冷启动误判）
    instances:
      user-service:
        base-config: default
      payment-service:
        failure-rate-threshold: 30          # 支付服务更敏感
```

### 3.3 降级：优雅的用户体验

当限流/熔断触发后，如何给用户一个"可接受的结果"？这就是降级的作用。

#### 降级策略设计

| 场景 | 降级策略 | 用户感知 |
|:-----|:---------|:---------|
| 推荐接口超时 | 返回热门榜单（缓存） | 内容可能不那么个性化 |
| 支付服务熔断 | 提示稍后重试 | 明确知道暂时无法支付 |
| 搜索服务降级 | 返回简化结果 | 结果不够精确 |
| 评论加载失败 | 隐藏评论区 | 页面正常，评论暂不可见 |

#### 统一降级处理

```java
@ControllerAdvice
public class GlobalFallbackHandler {

    @ExceptionHandler(RequestNotPermitted.class)
    public ResponseEntity<Result<?>> handleRateLimitException(RequestNotPermitted e) {
        log.warn("请求被限流: {}", e.getMessage());
        return ResponseEntity.status(429)
            .body(Result.fail(HttpStatusEnum.RATE_LIMIT_EXCEEDED, "系统繁忙，请稍后重试"));
    }

    @ExceptionHandler(CallNotPermittedException.class)
    public ResponseEntity<Result<?>> handleCircuitBreakerException(CallNotPermittedException e) {
        log.warn("熔断器开启: {}", e.getMessage());
        return ResponseEntity.status(503)
            .body(Result.fail(HttpStatusEnum.SERVICE_UNAVAILABLE, "服务暂时不可用，请稍后重试"));
    }
}
```

---

## 4. 核心配置

### 4.1 Maven 依赖

```xml
<!-- Spring Boot Actuator -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Micrometer Prometheus Registry -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

<!-- Resilience4j -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-micrometer</artifactId>
</dependency>
```

### 4.2 Actuator 配置

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  endpoint:
    health:
      show-details: always
  prometheus:
    metrics:
      export:
        enabled: true
```

---

## 5. 告警规则 (PromQL)

### 5.1 核心告警规则

#### 系统存活告警 (P0)
```yaml
- alert: InstanceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "服务实例宕机: {{ $labels.instance }}"
    description: "实例已停止响应超过 1 分钟，请立即检查。"
```

#### 错误率飙升 (P1)
```yaml
- alert: HighErrorRate
  expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.05
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "API 错误率过高"
```

#### 接口响应慢 (P2)
```yaml
- alert: SlowApiResponse
  expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 1.0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "API 响应缓慢 (P95 > 1s)"
```

#### 熔断器开启 (P1)
```yaml
- alert: CircuitBreakerOpen
  expr: resilience4j_circuitbreaker_state{state="open"} == 1
  for: 0m
  labels:
    severity: critical
  annotations:
    summary: "服务熔断触发: {{ $labels.name }}"
```

---

## 6. 故障排查手册

| 现象 | 可能原因 | 排查步骤 |
|:-----|:---------|:---------|
| **CPU 飙升 > 80%** | 死循环、频繁 GC、线程死锁 | 1. `top -H -p <pid>` 找高负载线程<br>2. `jstack <pid>` 导出线程栈<br>3. 配合 Grafana 查看 GC 频率 |
| **P99 延迟突增** | 数据库慢查、依赖服务响应慢、Full GC | 1. 检查 `http_server_requests` 确定慢接口<br>2. 检查 `jvm_gc_pause` 确认是否 GC 问题<br>3. 查看 Trace 确定瓶颈 |
| **内存溢出 (OOM)** | 内存泄漏、大对象分配、堆设置过小 | 1. 导出 Heap Dump (`jmap -dump`)<br>2. 使用 MAT 分析内存占用<br>3. 检查 `jvm_memory_used` 长期趋势 |
| **健康检查失败** | 依赖组件异常 | 检查组件连接状态、查看详细错误信息 |
| **限流不生效** | AOP代理问题 | 检查 `@EnableAspectJAutoProxy` 配置 |
| **熔断器频繁开启** | 失败率阈值过低 | 调整 `failure-rate-threshold` 参数 |

---

## 7. 总结

通过构建这套基于可观测性的保障体系，我们实现了：

- **全面可观测性**：基础设施 + 业务指标 + 健康检查三位一体
- **完善防护体系**：限流 + 熔断 + 降级，多层次安全防护
- **统一管理平台**：配置集中，避免重复和冲突
- **生产就绪**：支持 Kubernetes 探针、SLA 监控、告警集成

**监控发现问题，限流防止崩溃，熔断隔离故障**，这三者构成了高可用系统的坚实防线。
