# github-actions-deploy-pixel-tracker
Simple pixel tracker app deployed to AWS EC2

# Table of Contents
- [Usage](#usage)
  - [Quick start](#quick-start)
  - [Configure Observability](#configure-observability)
- [Usage (local)](#usage-local)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
  - [Environment](#environment)
    - [api-secret](#api-secret)
  - [Endpoints](#endpoints)
    - [/](#)
    - [/pixel/:id](#pixelid)
    - [/stats](#stats)
    - [/stats/:id](#statsid)
    - [/new-tracker](#new-tracker)
    - [/delete-tracker](#delete-tracker)


# Overview
Simple node pixel tracker app with deployment wrapped in a GitHub Action to deploy to AWS EC2.
If deploying with GitHub Actions, make sure to create a [Github secret](https://docs.github.com/es/actions/security-guides/encrypted-secrets). containing the DB credentials to be used after. (Copy the `.env.example` content and adjust acordingly.) 

# Usage

## Quick start
```yml
name: Deploy Pixel Tracker Sandbox

on:
  push:
    branches: [ main ]
    paths:
    - '.github/workflows/deploy-sandbox.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    # Bitovi's Deploy Pixel Tracker
    - id: deploy
      name: Deploy
      uses: bitovi/github-actions-deploy-pixel-tracker@0.1.0
      with:
        aws_access_key_id: ${{ secrets.AWS_ACCESS_KEY_ID_SANDBOX}}
        aws_secret_access_key: ${{ secrets.AWS_SECRET_ACCESS_KEY_SANDBOX}}
        env_ghs: ${{ secret.PIXEL_DB_CREDS }}
```

## Configure Observability
```yml
name: Deploy Pixel Tracker Sandbox

on:
  push:
    branches: [ main ]
    paths:
    - '.github/workflows/deploy-sandbox.yml'


jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ github.ref_name }}
      url: ${{ steps.deploy.outputs.lb_url }}

    steps:
    # Bitovi's Deploy Pixel Tracker
    - id: deploy
      name: Deploy
      uses: bitovi/github-actions-deploy-pixel-tracker@0.1.0
      with:
        aws_access_key_id: ${{ secrets.AWS_ACCESS_KEY_ID_SANDBOX}}
        aws_secret_access_key: ${{ secrets.AWS_SECRET_ACCESS_KEY_SANDBOX}}
        env_ghs: ${{ secret.PIXEL_DB_CREDS }}
        aws_ec2_instance_type: t2.small
        aws_default_region: us-east-1
        grafana_datasource_dir: observability/grafana/datasources    # If different 
        prometheus_config: observability/prometheus/prometheus.yml.  # 
        grafana_scrape_interval: 60m
        prometheus_scrape_interval: 60m
        prometheus_retention_period: 365d
```


# Usage (local)

## Requirements
- Docker

## Installation
1. Clone this repository
2. Run `docker-compose up`

## Getting Started

1. Copy `.env.example` to `.env`
2. Run `docker-compose up`
3. Create a new tracker
    - Send a POST request to `/new-tracker` with the `api-secret` param set to the value you set in your environment variables.
    - For more information, see the [new-tracker](#new-tracker) endpoint.
4. Get the pixel URL
    - The pixel URL is `http://localhost:8000/pixel/:id`
5. Add the pixel to your HTML
    - `<img src="http://localhost:8000/pixel/:id" />`
6. View stats at `http://localhost:3000`
    - Log in with the Grafana username and password you set in your environment variables.

## Environment
`.env` file is used to set environment variables.

### api-secret
A simple secret used to authenticate requests to the API.

In your environmet variables, set:
```bash
API_SECRET=foo
```

Then, when you request any endpoint except the pixel itself (and the `/metrics` endpoint), you must include the `api-secret` param with the value you set in your environment variables.




## Endpoints

| Endpoint | Description |
| --- | --- |
| `/` | Returns 200 OK. Use as health check. |
| `/pixel/:id` | Returns 200 OK and 1x1 pixel. Also logs the request. |
| `/stats` | Returns 200 OK and JSON object with all trackers and their stats. |
| `/stats/:id` | Returns 200 OK and JSON object with stats for specific tracker. |
| `/new-tracker` | Creates new tracker and returns 200 OK and JSON object with new tracker id. |
| `/delete-tracker` | Deletes tracker and returns 200 OK and JSON object with deleted tracker id. |




### /

Returns 200 OK. Use as health check.

#### Parameters
`N/A`

#### Response Code
`200 OK`

#### Response Body
> Pixel Tracker App (Version ...)


### /pixel/:id

Returns 200 OK and 1x1 pixel. Also logs the request.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Tracker ID |

#### Response Codes

##### 200

**Response Body**
> 1x1 pixel


### /stats

Returns 200 OK and JSON object with all trackers and their stats.

#### Parameters
`N/A`

#### Response Codes

##### 200

**Response Body**
```json
{
  "count": 0,
  "results": [{}]
}
```

#### Usage

##### Bash
```bash
API_SECRET=foo
curl -X GET http://localhost:8000/stats?api-secret=$API_SECRET
```


### /stats/:id

Returns 200 OK and JSON object with stats for specific tracker.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Tracker ID |

#### Response Codes

##### 200

**Response Body**
```json
{
  "id": "string",
  "count": 0,
  "result": {}
}
```

##### 404

**Response Body**
```json
{
  "message": "string",
  "status": 404
}
```

#### Usage

##### Bash
```bash
TRACKER_ID=1234567890
API_SECRET=foo
curl -X GET http://localhost:8000/stats/$TRACKER_ID?api-secret=$API_SECRET
```

### /new-tracker

Creates new tracker and returns 200 OK and JSON object with new tracker id.

#### Parameters
`N/A`

#### Response Codes

##### 200

**Response Body**
```json
{
  "id": "string"
}
```

#### Usage


##### Bash
> **Note:** be sure to set the contet type to Content-Type: application/json
```bash
API_SECRET=your_secret
CURL_BODY="{\"api-secret\": \"$API_SECRET\"}"
curl -X POST -d "$CURL_BODY" -H "Content-Type: application/json" http://localhost:8000/new-tracker
```



### /delete-tracker

Deletes tracker and returns 200 OK and JSON object with deleted tracker id.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `id` | `string` | Tracker ID |

#### Response Codes

##### 200

**Response Body**
```json
{
  "id": "string"
}
```

##### 404

**Response Body**
```json
{
  "message": "string",
  "status": 404
}
```

#### Usage

##### Bash
```bash
TRACKER_ID=1234567890
API_SECRET=foo
CURL_BODY="{\"api-secret\": \"$API_SECRET\"}"
curl -X POST -d "$CURL_BODY" -H "Content-Type: application/json" http://localhost:8000/delete-tracker/$TRACKER_ID
```



## Customizing

### Inputs
1. [Action Defaults](#action-defaults-inputs)
2. [AWS Configuration](#aws-configuration-inputs)
3. [Secrets and Environment Variables](#secrets-and-environment-variables-inputs)
4. [EC2](#ec2-inputs)
5. [Stack](#stack-inputs)
6. [Stack Management](#stack-management)
7. [Domains](#domains)
8. [VPC](#vpc-inputs)
9. [Advanced Options](#advanced-options)

### Outputs
1. [Action Outputs](#action-outputs)

The following inputs can be used as `step.with` keys
<br/>
<br/>

#### **Action defaults Inputs**
| Name             | Type    | Description                        | Required | Default |
|------------------|---------|------------------------------------|----------|---------|
| `checkout` | Boolean | Set to `false` if the code is already checked out. | false | true

#### **AWS Configuration Inputs**
| Name             | Type    | Description                        | Required | Default |
|------------------|---------|------------------------------------|----------|---------|
| `aws_access_key_id` | String | AWS access key ID. | true | |
| `aws_secret_access_key` | String | AWS secret access key. | true | |
| `aws_session_token` | String | AWS session token, if you're using temporary credentials. | false | |
| `aws_default_region` | String | AWS default region. | true | us-east-1 |
| `aws_resource_identifier` | String | Auto-generated by default so it's unique for org/repo/branch. Set to override with custom naming the unique AWS resource identifier for the deployment. Defaults to `${org}-${repo}-${branch}`. | false | `${GITHUB_ORG_NAME}-${GITHUB_REPO_NAME}-${GITHUB_BRANCH_NAME}` |
| `aws_extra_tags` | JSON | A list of additional tags that will be included on created resources. Example: `{"key1": "value1", "key2": "value2"}` | false | {} |

<hr/>
<br/>

#### **Secrets and Environment Variables Inputs**
| Name             | Type    | Description - Check note about [**environment variables**](#environment-variables). |
|------------------|---------|------------------------------------|
| `env_aws_secret` | String | Secret name to pull env variables from AWS Secret Manager, could be a comma separated list, read in order. Expected JSON content. |
| `env_repo` | String | File containing environment variables to be used with the app. |
| `env_ghs` | String | `.env` file to be used with the app from Github secrets. |
| `env_ghv` | String | `.env` file to be used with the app from Github variables. |

<hr/>
<br/>

#### **EC2 Inputs**
| Name             | Type    | Description                        |
|------------------|---------|------------------------------------|
| `aws_ec2_instance_type` | String | The AWS EC2 instance type. Default is `t3.medium`. |
| `aws_ec2_instance_profile` | String | The AWS IAM instance profile to use for the EC2 instance. Use if you want to pass an AWS role with specific permissions granted to the instance. |
| `aws_ec2_create_keypair_sm` | Boolean | Creates a Secret in AWS secret manager to store a kypair. Default is `false`. |
| `aws_ec2_instance_vol_size` | String | Root disk size for the EC2 instance. Default is `10`. |
| `aws_ec2_additional_tags` | JSON | A JSON object of additional tags that will be included on created resources. Example: `{"key1": "value1", "key2": "value2"}` |
| `aws_ec2_ami_filter` | String | AMI filter to use when searching for an AMI to use for the EC2 instance. Defaults to `ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*`. |
<hr/>
<br/>

#### **Stack Inputs**
| Name             | Type    | Description                        |
|------------------|---------|------------------------------------|
| `grafana_datasource_dir` | String | Path to the grafana datasource directory. Default is `observability/grafana/datasources`. |
| `prometheus_config` | String | Path to the prometheus config file. Default is `observability/prometheus/prometheus.yml`. |
| `grafana_scrape_interval` | String | Will change the global value of **the default** Prometheus data source. Default is `15s`. |
| `prometheus_scrape_interval` | String | Will set the global value of scrape_interval and evaluation_interval. Won't replace the intervals of scrape_config's if set. Default is `15s`. |
| `prometheus_retention_period`  | String | When to remove old data. Default is `15d`. |
| `cadvisor_enable` | Boolean | Adds a cadvisor entry in the docker-compose file to spin up a cadvisor container in docker. |
| `cadvisor_extra_targets` | String | Add cadvisor targets. Example: `"target1:8080,target2:8080"` |
| `node_exporter_enable` | Boolean | Adds a node-exporter entry in the docker-compose file to spin up a ode-exporter container in docker.  |
| `node_exporter_extra_targets` | String | Add node-exporter targets. Example: `"target1:9100,target2:9100"`|
| `print_yaml_files` | Boolean | Prints resulting docker-compose, prometheus and grafana yaml files. |
<hr/>
<br/>

#### **Stack Management**
| Name             | Type    | Description                        |
|------------------|---------|------------------------------------|
| `tf_stack_destroy` | Boolean | Set to `true` to destroy the created AWS infrastructure for this instance. Default is `false`. |
| `tf_state_file_name` | String | Change this to be anything you want to. Carefull to be consistent here. A missing file could trigger recreation, or stepping over destruction of non-defined objects. |
| `tf_state_file_name_append` | String | Append a string to the tf-state-file. Setting this to `unique` will generate `tf-state-aws-unique`. Can co-exist with the tf_state_file_name variable. |
| `tf_state_bucket` | String | AWS S3 bucket to use for Terraform state. Defaults to `${org}-${repo}-{branch}-tf-state-aws`. |
| `tf_state_bucket_destroy` | Boolean | Force purge and deletion of S3 tf_state_bucket defined. Any file contained there will be destroyed. `tf_stack_destroy` must also be `true`. |
<hr/>
<br/>

#### **Domains**
| Name             | Type    | Description                        |
|------------------|---------|------------------------------------|
| `aws_domain_name` | String | Define the root domain name for the application. e.g. bitovi.com. If empty, ELB URL will be provided. |
| `aws_sub_domain` | String | Define the sub-domain part of the URL. Defaults to `${org}-${repo}-{branch}`. |
| `aws_root_domain` | Boolean | Deploy application to root domain. Will create root and www DNS records. Domain must exist in Route53. |
| `aws_cert_arn` | String | Existing certificate ARN to be used in the ELB. Use if you manage a certificate outside of this action. See https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-list.html for how to find the certificate ARN. |
| `aws_create_root_cert` | Boolean | Generates and manage the root certificate for the application to be used in the ELB. |
| `aws_create_sub_cert` | Boolean | Generates and manage the sub-domain certificate for the application to be used in the ELB. |
| `aws_no_cert` | Boolean | Set this to true if you want not to use a certificate in the ELB. Default is `false`. |
<hr/>
<br/>

#### **VPC Inputs**
| Name             | Type    | Description                        |
|------------------|---------|------------------------------------|
| `aws_vpc_create` | Boolean | Define if a VPC should be created. Default is `false`. |
| `aws_vpc_name` | String | Set a specific name for the VPC. |
| `aws_vpc_cidr_block` | String | Define Base CIDR block which is divided into subnet CIDR blocks. Defaults to `10.0.0.0/16`. |
| `aws_vpc_public_subnets` | String | Comma separated list of public subnets. Defaults to `10.10.110.0/24`. |
| `aws_vpc_private_subnets` | String | Comma separated list of private subnets. If none, none will be created. |
| `aws_vpc_availability_zones` | String | Comma separated list of availability zones. Defaults to `aws_default_region`. |
| `aws_vpc_id` | String | **Existing** AWS VPC ID to use. Accepts `vpc-###` values. |
| `aws_vpc_subnet_id` | String | **Existing** AWS VPC Subnet ID. If none provided, will pick one. (Ideal when there's only one). |
| `aws_vpc_enable_nat_gateway` | Boolean | Adds a NAT gateway for each public subnet. Defaults to `false`.|
| `aws_vpc_single_nat_gateway` | Boolean | Toggles only one NAT gateway for all of the public subnets. Defaults to `false`.|
| `aws_vpc_external_nat_ip_ids` | String | **Existing** comma separated list of IP IDs if reusing. (ElasticIPs). |
| `aws_vpc_additional_tags` | JSON | A JSON object of additional tags that will be included on created resources. Example: `{"key1": "value1", "key2": "value2"}` |
<hr/>
<br/>

#### **Advanced Options**
| Name             | Type    | Description                        |
|------------------|---------|------------------------------------|
| `docker_cloudwatch_enable` | Boolean | Toggle cloudwatch creation for Docker. Defaults to `true`. |
| `docker_cloudwatch_skip_destroy` | Boolean | Toggle deletion or not when destroying the stack. Defaults to `false`. |
| `aws_ec2_instance_public_ip` | Boolean | Add a public IP to the instance or not. Defaults to `true`. |
| `aws_ec2_port_list` | String | EC2 Ports to be exposed. |
| `aws_elb_app_port` | String | Port in the EC2 instance to be redirected to. Default is `8000,3000`. | 
| `aws_elb_listen_port` | String | Load balancer listening port. Default is `443,3000`. |
<br/>

`aws_ec2_instance_public_ip` is a must if deployment is done using GitHub runners. Needed to access instance and install Docker. Only set this to `false` if using a self-hosted GitHub runner with access to your private IP.

As a default, the app port with SSL (443) and Grafana ports (3000) for the EC2 instance are being exposed. (`aws_ec2_port_list`). An ELB will also be created exposing them too. 

The load balancer will listen for outside connections (`aws_elb_listen_port`) and forward this traffic to the defined ports (`aws_elb_app_port`). 
You can change all of this values to expose the services you wish, directly from the EC2 instance or through the ELB. (No need to expose EC2 instance port for ELB ports to work.).
You can even set different listening ports for the ELB. (`aws_elb_listen_port` will map 1 to 1 with `aws_elb_app_port`.).

#### Default ports are:
| App     | Port | 
|-|-|
| Pixel-tracker | 8000 |
| Grafana | 3000 |
| Prometheus | 9090 |
| cadvisor | 8080 |
| node-exporter | 9100 | 
<br/>
<hr/>

#### **Action Outputs**
| Name             | Description                        |
|------------------|------------------------------------|
| `aws_vpc_id` | The selected VPC ID used. |
| `vm_url` | The URL of the generated app. |
| `instance_endpoint` | The URL of the generated ec2 instance. |
| `ec2_sg_id` | SG ID for the EC2 instance. |
<hr/>
<br/>


## Environment variables

For envirnoment variables in your app, you can provide:
 - `env_ghv` - An entry in [Github actions variables](https://docs.github.com/en/actions/learn-github-actions/variables)
 - `env_ghs` - An entry in [Github secrets](https://docs.github.com/es/actions/security-guides/encrypted-secrets)
 - `env_aws_secret` - The path to a JSON format secret in AWS
 

These environment variables are merged (in the following order) to the .env file and provided to both the Prometheus and Grafana services:
 - Terraform passed env vars ( This is not optional nor customizable )
 - Repository checked-in env vars - repo_env file as default. (KEY=VALUE style)
 - Github Secret - Create a secret named DOT_ENV - (KEY=VALUE style)
 - AWS Secret - JSON style like '{"key":"value"}'

## Note about resource identifiers

Most resources will contain the tag `${GITHUB_ORG_NAME}-${GITHUB_REPO_NAME}-${GITHUB_BRANCH_NAME}`, some of them, even the resource name after. 
We limit this to a 60 characters string because some AWS resources have a length limit and short it if needed.

We use the kubernetes style for this. For example, kubernetes -> k(# of characters)s -> k8s. And so you might see some compressions are made.

For some specific resources, we have a 32 characters limit. If the identifier length exceeds this number after compression, we remove the middle part and replace it for a hash made up from the string itself. 

### S3 buckets naming

Buckets names can be made of up to 63 characters. If the length allows us to add -tf-state, we will do so. If not, a simple -tf will be added.

## CERTIFICATES - Only for AWS Managed domains with Route53

As a default, the application will be deployed and the ELB public URL will be displayed.

If `domain_name` is defined, we will look up for a certificate with the name of that domain (eg. `example.com`). We expect that certificate to contain both `example.com` and `*.example.com`. 

If you wish to set up `domain_name` and disable the certificate lookup, set up `no_cert` to true.

Setting `create_root_cert` to `true` will create this certificate with both `example.com` and `*.example.com` for you, and validate them. (DNS validation).

Setting `create_sub_cert` to `true` will create a certificate **just for the subdomain**, and validate it.

> :warning: Be very careful here! **Created certificates are fully managed by Terraform**. Therefor **they will be destroyed upon stack destruction**.

To change a certificate (root_cert, sub_cert, ARN or pre-existing root cert), you must first set the `no_cert` flag to true, run the action, then set the `no_cert` flag to false, add the desired settings and excecute the action again. (**This will destroy the first certificate.**)

This is necessary due to a limitation that prevents certificates from being changed while in use by certain resources.

## Made with BitOps
[BitOps](https://bitops.sh) allows you to define Infrastructure-as-Code for multiple tools in a central place.  This action uses a BitOps [Operations Repository](https://bitops.sh/operations-repo-structure/) to set up the necessary Terraform and Ansible to create infrastructure and deploy to it.

## Contributing
We would love for you to contribute to [bitovi/github-actions-deploy-pixel-tracker](https://github.com/bitovi/github-actions-deploy-pixel-tracker) and help make it even better than it is today!

Would you like to see additional features?  [Create an issue](https://github.com/bitovi/github-actions-deploy-pixel-tracker/issues/new) or a [Pull Requests](https://github.com/bitovi/github-actions-deploy-pixel-tracker/pulls).

## License
The scripts and documentation in this project are released under the [MIT License](https://github.com/bitovi/github-actions-deploy-pixel-tracker/blob/main/LICENSE).