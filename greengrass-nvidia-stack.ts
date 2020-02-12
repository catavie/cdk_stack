import cdk = require('@aws-cdk/core');
import iot = require('@aws-cdk/aws-iot');
import lambda = require('@aws-cdk/aws-lambda');
import greengrass = require('@aws-cdk/aws-greengrass');
 
interface GreengrassNvidiaStackProps extends cdk.StackProps {
  greengrassLambdaAlias: lambda.Alias
}
 
export class GreengrassNvidiaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: GreengrassNvidiaStackProps) {
    super(scope, id, props);
 
    const certArn: string = '##ARN of the certificate you just created##'
    const region: string = cdk.Stack.of(this).region;
    const accountId: string = cdk.Stack.of(this).account;
 
    // AWS IoT
    const iotThing = new iot.CfnThing(this, 'Thing', {
      thingName: 'Nvidia_Thing'
    });
 
    if (iotThing.thingName !== undefined) {
       
      const thingArn = `arn:aws:iot:${region}:${accountId}:thing/${iotThing.thingName}`;
 
      // Create IoT policy
      const iotPolicy = new iot.CfnPolicy(this, 'Policy', {
        policyName: 'Nvidia_Policy',
        policyDocument: {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "iot:*",
                "greengrass:*",
              ],
              "Resource": [
                "*"
              ]
            }
          ]
        }
      });
      iotPolicy.addDependsOn(iotThing);
 
      // Attach a policy to certificate
      if (iotPolicy.policyName !== undefined) {
        const policyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(this, 'PolicyPrincipalAttachment', {
          policyName: iotPolicy.policyName,
          principal: certArn
        })
        policyPrincipalAttachment.addDependsOn(iotPolicy)
      }
 
      // Attach a certificate to a thing
      const thingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(this, 'ThingPrincipalAttachment', {
        thingName: iotThing.thingName,
        principal: certArn
      });
      thingPrincipalAttachment.addDependsOn(iotThing)
 
      // Create Greengrass Core
      const coreDefinition = new greengrass.CfnCoreDefinition(this, 'CoreDefinition', {
        name: 'Nvidia_Core',
        initialVersion: {
          cores: [
            {
              certificateArn: certArn,
              id: '1',
              thingArn: thingArn
            }
          ]
        }
      });
      coreDefinition.addDependsOn(iotThing)
 
      // Greengrass Create resources
      const resourceDefinition = new greengrass.CfnResourceDefinition(this, 'ResourceDefinition', {
        name: 'Nvidia_Resource',
        initialVersion: {
          resources: [
            {
              id: '1',
              name: 'log_file_resource',
              resourceDataContainer: {
                localVolumeResourceData: {
                  sourcePath: '/log',
                  destinationPath: '/log'
                }
              }
            }
          ]
        }
      });
 
      // Greengrass Lambda creation
      const functionDefinition = new greengrass.CfnFunctionDefinition(this, 'FunctionDefinition', {
        name: 'Nvidia_Function',
        initialVersion: {
          functions: [
            {
              id: '1',
              functionArn: props.greengrassLambdaAlias.functionArn,
              functionConfiguration: {
                encodingType: 'binary',
                memorySize: 65536,
                pinned: true,
                timeout: 3,
                environment: {
                  // Give resource permission to write log file
                  resourceAccessPolicies: [
                    {
                      resourceId: '1',
                      permission: 'rw'
                    }
                  ]
                }
              }
            }
          ]
        }
      });
 
      // Greengrass group
      const group = new greengrass.CfnGroup(this, 'Group', {
        name: 'Nvidia',
        initialVersion: {
          coreDefinitionVersionArn: coreDefinition.attrLatestVersionArn,
          resourceDefinitionVersionArn: resourceDefinition.attrLatestVersionArn,
          functionDefinitionVersionArn: functionDefinition.attrLatestVersionArn
        }
      });
 
      // Definition
      group.addDependsOn(coreDefinition)
      group.addDependsOn(resourceDefinition)
      group.addDependsOn(functionDefinition)
    }
  }
}