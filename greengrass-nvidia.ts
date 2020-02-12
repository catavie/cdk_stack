#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { GreengrassNvidiaStack } from '../lib/greengrass-nvidia-stack';
import { GreengrassLambdaStack } from '../lib/greengrass-lambda-stack';
 
const app = new cdk.App();
 
const lambdaStack = new GreengrassLambdaStack(app, 'GreengrassLambdaStack');

new GreengrassNvidiaStack(app, 'GreengrassNvidiaStack', {
    greengrassLambdaAlias: lambdaStack.greengrassLambdaAlias
});