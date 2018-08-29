---
title: Kubernetes内部服务如何被外部访问
date: 2018-05-14 19:14:59
tags: k8s
categories: 理论知识
---
#### 一：回顾

	在理论基础篇简单的对"外部系统访问Service的问题"做了一点点研究，这次来仔细看看Kubernetes内部服务是如何接收并处理来自外部的用户请求的。

	简单来说，上篇最后介绍的服务暴露三种方式：

 1. NodePort，就是在每个计算节点/虚拟机上开放端口，访问这个节点的这个端口就会被转发到服务。应用转发层可以手动转发用户请求到这些服务。显然这个方式太low了，不够自动化，智能化。（在节点很多的情况下怎么知道服务被部署到那个计算节点上了...）

 2. LoadBalancer，LB的在Service内定义（可以这么理解？），也就意味这每个Service都会创建一个LB? 每个LB都有自己的IP地址，那在公有云上的，好像就需要很多个LB？LB并不是免费的。而且流量通过LB直接就到服务了？没有任何匹配、规则（相对NGINX来说）！再说如果离开了云平台呢？

    这样的方式和现在的架构比，有点像在SLB直接将流量转发到具体的后端服务了。

 3. Ingress，  入口。可以理解为集群的入口，可以被当做集群内所有服务的入口，并且担任"智能路由"的角色（edge router）。

    ee...具体就是这样（官网就是这样解释的）：

    ```yaml
    internet --> Services    
    ⬇️
    internet --> Ingress --> Service
    ```

#### 二：分析

	目前看来也只有Ingress有点符合咱们目前的架构需求（可控，自动化，等等），看看Ingress是如何工作的。Ingress有三个组件：

	Ingress Controller、Ingress、反向代理负载均衡器（nginx?）

	他们三个的关系是，Ingress Controller 与Kubernetes API交互，可感知集群内的Service、Pod变化。Ingress Controller在结合Ingress生成配置，更新反向代理负载均衡器，刷新配置实现动态发现和更新。

	Ingress是一个规则集合（在k8s中属于一种资源），定义了域名和集群内的Service的对应关系。相当与nginx配置域名文件和其中的不同localtion ？

![ingress](http://github-images.test.upcdn.net/github.io/Ingress.png)

在新版本中 Nginx 与 Ingress Controller合并为一个组件（从部署角度来看只需要部署 Ingress Controller）

> Ingress-controller 实例

[k8s 官网教程](https://kubernetes.github.io/ingress-nginx/deploy/) [github地址](https://github.com/kubernetes/ingress-nginx/blob/master/docs/examples/static-ip/nginx-ingress-controller.yaml)

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-ingress-controller
  labels:
    k8s-app: nginx-ingress-controller
spec:
  replicas: 1
  selector:
    matchLabels:
      k8s-app: nginx-ingress-controller
  template:
    metadata:
      labels:
        k8s-app: nginx-ingress-controller
    spec:
      # hostNetwork makes it possible to use ipv6 and to preserve the source IP correctly regardless of docker configuration
      # however, it is not a hard dependency of the nginx-ingress-controller itself and it may cause issues if port 10254 already is taken on the host
      # that said, since hostPort is broken on CNI (https://github.com/kubernetes/kubernetes/issues/31307) we have to use hostNetwork where CNI is used
      # like with kubeadm
      # hostNetwork: true
      terminationGracePeriodSeconds: 60
      containers:
      - image: quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.14.0
        name: nginx-ingress-controller
        readinessProbe:
          httpGet:
            path: /healthz
            port: 10254
            scheme: HTTP
        livenessProbe:
          httpGet:
            path: /healthz
            port: 10254
            scheme: HTTP
          initialDelaySeconds: 10
          timeoutSeconds: 1
        ports:
        - containerPort: 80
          hostPort: 80
        - containerPort: 443
          hostPort: 443
        env:
          - name: POD_NAME
            valueFrom:
              fieldRef:
                fieldPath: metadata.name
          - name: POD_NAMESPACE
            valueFrom:
              fieldRef:
                fieldPath: metadata.namespace
        args:
        - /nginx-ingress-controller
        - --default-backend-service=$(POD_NAMESPACE)/default-http-backend
        - --publish-service=$(POD_NAMESPACE)/nginx-ingress-lb
        securityContext:
          runAsNonRoot: false
```



> nginx-Ingress 实例

[github地址](https://github.com/kubernetes/ingress-nginx/blob/master/docs/examples/static-ip/nginx-ingress.yaml)

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress-nginx
spec:
  tls:
  # This assumes tls-secret exists.
  - secretName: tls-secret
  rules:
  - http:
      paths:
      - backend:
          # This assumes http-svc exists and routes to healthy endpoints.
          serviceName: http-svc
          servicePort: 80
```



> 网络层负载

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-ingress-lb
  labels:
    app: nginx-ingress-lb
spec:
  externalTrafficPolicy: Local
  type: LoadBalancer
  loadBalancerIP: 104.154.109.191
  ports:
  - port: 80
    name: http
    targetPort: 80
  - port: 443
    name: https
    targetPort: 443
  selector:
    # Selects nginx-ingress-controller pods
    k8s-app: nginx-ingress-controller
```

#### 三：总结

 所以服务暴露的方式就变成了：

```yaml
user -> domain -> SLB -> Ingress controller -> service -> Pod
```
