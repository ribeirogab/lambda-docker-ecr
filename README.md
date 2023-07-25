# Lambda Docker (ECR)

Source: <https://docs.aws.amazon.com/lambda/latest/dg/nodejs-image.html#nodejs-image-base>

---

## Create project and image

1. Create a directory for the project

```bash
mkdir lambda-docker
cd lambda-docker

npm init -y
```

2. Create a new file `index.js`

```js
exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({ message: 'Hello from Lambda!' }),
    };
    
    return response;
};
```

3. Create `Dockerfile`

```Dockerfile
FROM public.ecr.aws/lambda/nodejs:16

# Copy function code
COPY index.js ${LAMBDA_TASK_ROOT}
  
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]
```

4. Build image

```bash
docker build -t `docker-image`:`test` .
```

5. Testing the image locally

```bash
docker run -p 9000:8080 docker-image:test

curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"payload":"hello world!"}'
```

## Deploying the image

1. Authentication

```bash
aws ecr get-login-password | docker login --username AWS --password-stdin 111122223333.dkr.ecr.us-east-2.amazonaws.com
```

2. Create a Amazon ECR repository using `aws ecr`

```bash
aws ecr create-repository --repository-name hello-world --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE
```

If successful, you see a response like this:

```json
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:us-east-2:111122223333:repository/hello-world",
        "registryId": "111122223333",
        "repositoryName": "hello-world",
        "repositoryUri": "111122223333.dkr.ecr.us-east-2.amazonaws.com/hello-world",
        "createdAt": "2023-03-09T10:39:01+00:00",
        "imageTagMutability": "MUTABLE",
        "imageScanningConfiguration": {
            "scanOnPush": true
        },
        "encryptionConfiguration": {
            "encryptionType": "AES256"
        }
    }
}
```

3. Run the [docker tag](https://docs.docker.com/engine/reference/commandline/tag/) command to tag your local image into your Amazon ECR repository as the latest version. In this command:

- Replace `docker-image:test` with the name and [tag](https://docs.docker.com/engine/reference/commandline/build/#tag) of your Docker image.
- Replace the Amazon ECR repository URI with the `repositoryUri` that you copied. Make sure to include `:latest` at the end of the URI.

```bash
docker tag docker-image:test 111122223333.dkr.ecr.us-east-2.amazonaws.com/hello-world:latest
```

4. Run the [docker push](https://docs.docker.com/engine/reference/commandline/push/) command to deploy your local image to the Amazon ECR repository. Make sure to include `:latest` at the end of the repository URI.

```bash
docker push 111122223333.dkr.ecr.us-east-2.amazonaws.com/hello-world:latest
```

## Create Lamba

1. Create the Lambda function. For `ImageUri`, specify the repository URI from earlier. Make sure to include `:latest` at the end of the URI.

- it is necessary to create the `lambda-example` role beforehand

```bash
aws lambda create-function \
  --function-name hello-world \
  --package-type Image \
  --code ImageUri=111122223333.dkr.ecr.us-east-1.amazonaws.com/hello-world:latest \
  --role arn:aws:iam::111122223333:role/lambda-example
```

2. Invoke the function

```bash
aws lambda invoke --function-name hello-world response.json
```

You should see a response like this:

```json
{ "ExecutedVersion": "$LATEST", "StatusCode": 200 }
```

*To see the output of the function, check the `response.json` file.*
