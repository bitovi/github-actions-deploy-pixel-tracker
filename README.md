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
