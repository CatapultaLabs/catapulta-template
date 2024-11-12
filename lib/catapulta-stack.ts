import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class CatapultaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // VPC setup
        const vpc = new ec2.Vpc(this, 'CatapultaVpc', {
            maxAzs: 2,
        });

        // ECS cluster
        const cluster = new ecs.Cluster(this, 'CatapultaCluster', {
            vpc,
        });

        // RDS instance (free tier eligible)
        const database = new rds.DatabaseInstance(this, 'CatapultaRdsInstance', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_16_4, // Choose version
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO), // Free tier eligible instance
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            publiclyAccessible: true,
            allocatedStorage: 20, // Free tier allows up to 20 GB
            storageType: rds.StorageType.GP2,
            databaseName: 'CatapultaDB',
            credentials: rds.Credentials.fromGeneratedSecret('postgres'), // Auto-generate password for 'postgres' user
            removalPolicy: RemovalPolicy.DESTROY, // Set to REMOVE in production
        });

        // Allow ECS tasks to connect to RDS
        database.connections.allowFrom(cluster, ec2.Port.tcp(5432));

        // Docker image build (points to Dockerfile)
        const dockerImage = new DockerImageAsset(this, 'CatapultaDockerImage', {
            directory: path.join(__dirname, '../'), // Path to your Next.js app (root of the project)
            platform: Platform.LINUX_AMD64
        });

        // S3 bucket for storing application data
        const bucket = new s3.Bucket(this, 'CatapultaBucket', {
            versioned: false,
            removalPolicy: RemovalPolicy.DESTROY, // Remove bucket in production if needed
            autoDeleteObjects: true, // Delete all objects when bucket is removed
        });

        // Fargate Service with Application Load Balancer
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'CatapultaFargateService', {
            cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromDockerImageAsset(dockerImage),
                containerPort: 3000, // Ensure this matches the port in your Dockerfile
                environment: {
                    DATABASE_HOST: database.dbInstanceEndpointAddress,
                    DATABASE_NAME: 'CatapultaDB',
                    DATABASE_USER: 'postgres',
                    DATABASE_PASSWORD: 'postgres',
                    S3_BUCKET_NAME: bucket.bucketName, // Pass the bucket name to the container
                },
            },
            desiredCount: 1, // Number of running instances
            memoryLimitMiB: 512,
            cpu: 256,
            publicLoadBalancer: true, // Set this to true to make it accessible via the internet
        });

        bucket.grantReadWrite(fargateService.taskDefinition.taskRole);
    }
}
