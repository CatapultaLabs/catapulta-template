#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CatapultaStack } from '../lib/catapulta-stack';

const app = new cdk.App();
new CatapultaStack(app, 'CatapultaStack');
