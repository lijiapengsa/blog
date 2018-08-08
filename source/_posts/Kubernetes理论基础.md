---
title: Kubernetes理论基础
date: 2018-05-12 21:44:59
tags: k8s
categories: 理论知识
---
#### Kubernetes定义

​	kubernetes是Google开源的容器集群管理系统，2014年6月开源。在Docker技术之上，为容器应用提供资源调度、部署运行、服务发现、扩容缩容、等功能，可以看做是基于容器的micro-pass平台，pass的代表性项目。

#### Kubernetes特性

 * 强大的容器编排能力
 * 轻量级
 * 开放开源

#### Kubernetes核心概念

##### 1. Pod

  	Pod是若干容器的组合，一个Pod内的容器都必须运行在同一台宿主机上，这些容器使用相同的命名空间，IP地址和端口，可以通过localhost互相发现和通信。可以共享一块存储卷空间。是Kubernetes中最小的管理单位。通过Pod更高层次的抽象，提供了更加灵活的管理方式。

##### 2.  Service

   	Service是应用服务的抽象，定义了Pod的逻辑上的集合和访问Pod集合的策略。Service将代理Pod对外表现为一个单一的访问接口，外部不需要了解Pod如何运行，这给扩展和维护带来很多好处，提供了一套简化的服务代理和发现机制

   例如：

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
   	name: tomcat-service
   spec:
    	ports:
       - port: 8080
       selector:
         tier: fronted
   ```

   ​	上面定义一个名为 "tomcat-service" 的Service，服务端口为8080，所有拥有"fronted"的这个Label的所有Pod实例都属于这个Service。即所有 tomcat-service的流量都会被转发到这些Pod

##### 3. Replication Controller（RC）

   ​	顾名思义"RC"用来控制做复制控制，确保用户定义的Pod副本数保持不变。RC是弹性伸缩、滚动升级的核心。

   例如：

   ```yaml
   apiVersion: v1
   kind: ReplicationContorller
   metadata:
   	name: nginx
   spec:
   	replicas: 3
   	selector:
   	  app: nginx
   	template:
   	  metadata:
   	 	name: nginx
   		labels:
   		  app: ningx
   	  spec:
   		containers:
   		  - name: nginx
   		  - images: nginx
   		  ports:
   		   - containerPort: 80
   ```

   ​	上面展示了创建三个nginx的Pod，Kubernetes中Controller Manger会尽量将拥有"app: nginx"标签的三个Pod会分布不同的Node上，保证集群中总是会有符合RC定义的数量的Pod。当任意一个Pod、或者所属的Node出现问题，Controller Manager会自动创建新的Pod。

   ​	可以通过控制RC来控制Pod的副本数量，来达到动态缩放的目的:

   ```bash
   kebectl scale rc nginx --replicas=1
   ```

   ​	RS 和 RC 什么关系 ？

##### 4. Replica Sets (RS)

   ​	ReplicaSet（RS）是 RC 的升级版，它们的区别是对选择器的支持。RS支持 [labels user guide](http://docs.kubernetes.org.cn/247.html#Labels)中描述的set-based选择器要求，而 RC 仅仅支持qeuality-based的选择器要求。(看一眼超链接内容、或者下文Label的内容)

   ​	RS 虽然可以单独使用，但是还是被Deployments用作Pod的创建、删除、更新。使用Deployment时，不必关心RS。可以通过Deployment管理RS。

   ​	RS 和 RC都是确保运行指定数量的Pod。Deployment 是一个更高层次的概念，可以管理RS，并且提供对Pod更新等功能，建议使用Deployment来管理RS。

   ​	RS 对我是隐藏的？ 直接使用Deployment来管理?

##### 5. Deployment

   ​	Deployment是为了更好的解决Pod的编排问题，在内部使用RS（RC升级版）来实现目的。在Deployment中描述目标状态，Deployment Controller就会自动实现Deploymen中描述的目标状态，并指导当前Pod的进度状态。（部署是否完成）

   ​	Deployment创建的对象不能手动进行管理！

   例如：

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: nginx-deployment
     labels:
       app: nginx
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: nginx
     template:
       metadata:
         labels:
           app: nginx
       spec:
         containers:
         - name: nginx
           image: nginx:1.7.9
           ports:
           - containerPort: 80
   ```

   ​	可以看到上面并没有RS/RC的配置。但是Deployment会自动使用RS的方式创建Pod和Pod副本。

##### 6. Label

   ​	Label就是一对 key/value，可以被关联到对象（Node、Pod、Service、RS），一个对象可以关联任意数量的Label，同一个Label也可以被关联到任务数量的对象上。通常在定义对象时确定，也可以创建对象后动态添加删除。

   ​	可以通过对象的Label来实现多维度的资源分组管理，可以方便的进行资源分配、调度、配置、部署等管理工作。常用的Label如下：

   ```yaml
   * 版本标签release: stable、canary
   * 环境标签env: dev、production
   * 架构标签tier: frontend、backend、middleware
   * 分区标签partition: customerA、customerB
   * 质量管控标签track: daily、weekly	Master

   ```

   	Selector可以理解为SQL查询语句中的where条件，在定义定义Service、RC/RS、Deployment时，指定相应的Label就会和自动对应的Pod对象。

##### 7. Horizontal Pod Autoscaler（HPA）

​	上面说到可以通过命令（kebectl scale）手动调节Pod的数量上限扩容缩容，显然这不够自动化。从Kubernetes1.1版本开始，HPA功能被当做重量级特性推出。与RC、Deployment一样，都属于Kubernetes的一种资源对象，通过追踪分析RC控制的所有目标`Pod的负载`情况针对性的调整目标Pod的副本数量（实现原理？）。

​	Pod负载度量指标:

```yacas
* CPUutilizationPercentage
	这是一个算数平均值，即所有Pod的自身CPU利用率的平均值。
* 应用自定义指标（TPS/QPS)
```

##### 8. Master

​	Master是Kubernetes集群中的控制节点，一般会独自占据一个服务器，Master节点上有以下关键组件：

```yaml
Kubernetes API server (kube-apiserver), http rest接口的关键进程，是所有操作指令的唯一入口。
Kubernetes Controller Manager(kube-controller-manager), 所有资源对象的自动化控制中心。
Kubernetes Scheduler (kkube-scheduler,负责资源(Pod)的调度。Pod的"调度室"
```

##### 9. Node

​	Node可以理解为Kubernetes集群中的计算节点/工作节点，当某个Node宕机时，这个Node节点上的负载会自动转移到其他节点上去。Node节点上有一下关键组件：

```yaml
kubelet: Pod 对应的容器创建、启停、等
kube-proxy: 实现 Service的通信与负载均衡机制的重要组件
docker: e，就是docker
```

##### 10. Namespace

​	当团队或者项目中有多个用户时，可以使用Namepace来区分，namespace是一种将集群资源划分多个用途的方法。主要用于实现多租户的资源隔离，通过Namespace将集群内部资源对象分配到不同的Namespace中。形成逻辑上的分组，Kubernetes集群启动后会自动创建一个"default"的namespace。

##### 11. Volume

​	Volume（存储卷）可以被理解为Pod中的共享目录，volume被定义在Pod上，Pod内的容器可以访问挂载。volume与Pod的生命周期相同，与具体的docker 容器生命周期不相关，某个docker容器删除或停止时，Volume中的数据不回丢失，volume支持很多种类型文件系统，GFS/Ceph/NFS。

​	在Kubernetes中volume有几种类型：

```yaml
1. emptyDir: 无需指定对应宿主机上的目录文件、无需永久保留的临时目录，跟随Pod的移除而被移除。
2. hostPath: 为Pod挂载宿主机上的文件或目录，使用宿主机的文件系统存储，这样的方式Kubernetes无法对宿主机上的资源纳入管理（比如资源配额），各个Node节点上的目录文件不同而导致Valume的访问结果不一致。
3. gcePersistentDisk: Google共有云提供的永久磁盘。
4. awsElasticBloukStore: AWS提供的 EBS Volume存储。
5. NFS: 网络文件存储系统
6. iscsi: iscsi 存储设备
7. flocker: Flocker ??
8. glusterfs: 开源的ClusterFS网络文件存储系统
9. rbd: Linux 块设备共存存储
10. gitRepo: 从GIT 库cone一个git repository 给Pod用
11. secret: Kubernetes中一种保存机密信息的volume，Pod通过挂载的方式获取账号密码信息
```

#### Kubernetes的服务发现机制

​	Kubernetes中的每个Service都有一个唯一的Cluster IP 和唯一的名字，名字是开发者自己定义，部署的时候也不会改变，可以固定在配置中，所以这个问题就是：用Service 名字找到对应Cluster IP。

​	老的解决方案中需要设置一大堆环境变量，每个Service创建时就会生成对应的环境变量，然后Service中的每个Pod启动时就会加载这些变量。在后来的版本中引入了DNS系统，把服务名作为DNS域名，这样程序就可以直接使用服务名来建立通信。

#### 外部系统访问Service的问题

> Kubernetes集群中有三种IP：

* Node IP：Node 计算节点的IP

* Pod IP：Pod 的IP地址
* Cluster IP:  Service 的IP地址

> 解释

* Node IP 是集群中每个物理节点的IP地址，是真实存在于物理网络中的。

* Pod IP 是每个Pod的IP地址，是docker 根据docker0 网桥的IP地址段进行分配的，是衣蛾虚拟的二层网络。Kubernetes集群中要求位于不同Node上的Pod能够直接通信，所以一个Pod内的容器和另一个Pod内的容器通信就是通过Pod IP 所在的虚拟二层网络完成的。而实际的TCP/IP流量测试通过Node IP所在屋里网卡流出的。

* Cluster IP 属于Service，也是一个虚拟的IP地址。仅仅作用于Kubernetes Service 这个对象、无法ping、只能和Service Port组成一个具体的通信端口。Kubernetes集群外部无法直接使用个IP，而当服务必须被外部访问时，可以采用NodePort 的方法。

  例如:

  ```yaml
  apiVersion: v1
  kind: Service
  metadata:
    name: nginx-service
  spec:
    type: NodePort
    ports:
     - port: 8080
     nodePort: 31002
    selector:
      tier: frontend
  ```

  我们访问http://Node:31002 即可

* NodePort 衍生的负载均衡问题

  ​	NodePort的方式在每个Node节点上开放了端口，想让用户的请求转发到这些Node上的端口，就需要一个负载均衡器。负载均衡器可以在Kubernetes集群内部，还是也可以在集群外部？

  ​	在集群外部，比如GCE公有云，只要把Service的type=NodePort改为type=LoadBalancer，Kubernetes就会自动创建一个对应的Load balancer，并返回他的IP地址供外部客户端使用。其他云看支不支持了。

* 最后，可以通过 NodePort、LB、Ingress（还没研究）这三个方式?

  * [Ingress阿里云的文档](https://yq.aliyun.com/articles/575996) (依赖阿里云)
