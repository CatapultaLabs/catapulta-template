import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class CatapultaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // VPC setup
        const vpc = new ec2.Vpc(this, 'CatapultaVpc', {
            maxAzs: 1, // Number of availability zones
        });

        // ECS cluster
        const cluster = new ecs.Cluster(this, 'CatapultaCluster', {
            vpc,
        });

        // Docker image build (points to Dockerfile)
        const dockerImage = new DockerImageAsset(this, 'CatapultaDockerImage', {
            directory: path.join(__dirname, '../'), // Path to your Next.js app (root of the project)
            platform: Platform.LINUX_AMD64
        });

        // Fargate Service with Application Load Balancer
        new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'CatapultaFargateService', {
            cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromDockerImageAsset(dockerImage),
                containerPort: 3000, // Ensure this matches the port in your Dockerfile
            },
            desiredCount: 1, // Number of running instances
            memoryLimitMiB: 512,
            cpu: 256,
            publicLoadBalancer: true, // Set this to true to make it accessible via the internet
        });
    }
}
