---
title: k8s05-部署dashboard展板
date: 2018-06-13 16:55:08
tags: k8s
categories: 操作实践
---
### 1. 部署 dashboard

下载配置 dashboard 描述文件：

```bash
# 原本描述文件
https://raw.githubusercontent.com/kubernetes/dashboard/master/src/deploy/recommended/kubernetes-dashboard.yaml
# 实际使用(更改后)描述文件
https://github.com/lijiapengsa/k8s/tree/master/Doc/dashboard/kubernetes-dashboard.yaml
```

> 解释：不管使用以上哪个 kube-dns 的描述文件后都需要根据实际环境需要修改三个地方：
>
> 1. dashboard启动参数：Deployment 配置块 args：处添加 --apiserver-host=http://192.168.10.249:8080
> 2. 启动image：将google 的image 替换为阿里云的 registry.cn-beijing.aliyuncs.com/k8s_images/kubernetes-dashboard-amd64:v1.8.3
> 3. 端口暴露：service配置块添加NodePort暴露方式(可参考[Kubernetes内部服务如何被外部访问](https://lijiapengsa.github.io/2018/05/14/Kubernetes%E5%86%85%E9%83%A8%E6%9C%8D%E5%8A%A1%E5%A6%82%E4%BD%95%E8%A2%AB%E5%A4%96%E9%83%A8%E8%AE%BF%E9%97%AE/))

```bash
# 创建
root@k8s01:/apps/k8s/dashboard# kubectl  create  -f kubernetes-dashboard.yaml
secret "kubernetes-dashboard-certs" created
serviceaccount "kubernetes-dashboard" created
role.rbac.authorization.k8s.io "kubernetes-dashboard-minimal" created
rolebinding.rbac.authorization.k8s.io "kubernetes-dashboard-minimal" created
deployment.apps "kubernetes-dashboard" created
```

```bash
# 等待10s-20s
root@k8s01:/apps/k8s/dashboard# kubectl get svc --namespace=kube-system
NAME                   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
kube-dns               ClusterIP   10.211.200.2    <none>        53/UDP,53/TCP   36m
kubernetes-dashboard   NodePort    10.211.32.240   <none>        443:32149/TCP   4s
root@k8s01:/apps/k8s/dashboard# kubectl get pods --namespace=kube-system
NAME                                    READY     STATUS    RESTARTS   AGE
kube-dns-5c68b47b5-gjgs9                3/3       Running   0          37m
kubernetes-dashboard-57ccc88449-jnmkh   1/1       Running   0          40s
```

> 解释： 以上结果说明 dashboard 的 pod 和service 都已经被创建，且都是READY状态

###  2. 测试 dashboard

##### 先获取access_token：

```bash
kubectl  -n kube-system describe secret $(kubectl -n kube-system get secret | grep dashboard |grep token | awk '{print $1}')
```

![image-20180613185353699](http://github-images.test.upcdn.net/github.io/image-20180613185353699.png)

##### 通过NodePort方式访问

* 在集群每台节点都部署了kube-proxy的情况下，可任意按照以下方式访问集群内的一个节点。就可以访问到dashboard

* 访问 （只限NodePort方式部署可用）

  必须使用https方式访问

  ex： https://192.168.10.247:30001 （30001是我在描述文件里面定义的）

##### 登陆

<__> 选择令牌-输入令牌-登陆-登陆后就是以下界面：

![image-20180611182825620](http://github-images.test.upcdn.net/github.io/image-20180611182825620.png)

dashboard部署初步完成
