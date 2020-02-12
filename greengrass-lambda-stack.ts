import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
 
export class GreengrassLambdaStack extends cdk.Stack {
 
    public readonly greengrassLambdaAlias: lambda.Alias;
 
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
 
        // Create and Deploy Lambda to Greengrass
        const greengrassLambda = new lambda.Function(this, 'GreengrassSampleHandler', {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.asset('handlers'),
            handler: 'handler.handler',
        });
        const version = greengrassLambda.addVersion('GreengrassSampleVersion');
 
        // Greengrass Lambda specify the alias
        this.greengrassLambdaAlias = new lambda.Alias(this, 'GreengrassSampleAlias', {
            aliasName: 'nvidiaLambda',
            version: version
        })
    }
}