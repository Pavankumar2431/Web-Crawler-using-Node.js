# Web-Crawler-using-Node.js
This project is a web crawler application built using Node.js, Express, and Puppeteer. It allows users to crawl websites, extract product URLs, and save the results in a CSV file. The application is deployed on Railway.

## Features

* Crawls multiple websites and extracts product URLs.
* Handles infinite scrolling to fetch dynamic content.
* Stores the extracted URLs in a CSV file (product_urls.csv).
* Provides API endpoints to initiate crawling, download the CSV file, and view the extracted data in JSON format.

##  Tech Stack

* Node.js: Backend runtime.
* Express: Web framework.
* Puppeteer: Headless browser automation.
* puppeteer-cluster: Efficient handling of multiple browser instances.
* fs: File system operations for CSV handling.

 ## Prerequisites

* Node.js and npm installed.
* Railway account (for deployment).
## Installation
### 1. Clone the repository: 
    git clone https://github.com/Pavankumar2431/Web-Crawler-using-Node.js.git
    cd Web-Crawler-using-Node.js
### 2. Install dependencies:
    npm install
### 3. Ensure Puppeteer dependencies are installed. If deploying locally, install Chromium:
    npx puppeteer install

## Usage
### Running Locally
### 1. Start the server:
    npm start
### 2. Make a POST request to start crawling. Example request body:
    {
    "websites": [
    "https://www.example1.com",
    "https://www.example2.in",
    // add more here
                ]
    }
### Use a tool like Postman or cURL to test the endpoint:
    curl -X POST http://localhost:3000/start-crawl -H "Content-Type: application/json" -d '{"websites": ["https://www.example1.com", "https://www.example2.in"]}'
### 3. Access the data:
  * Download CSV: GET /download-data
  * View JSON: GET /view-data

## Deploying on Railway

#### 1. Push the code to a GitHub repository.
#### 2. Link the repository to your Railway project.
#### 3. Set the start command in Railway's settings:
    npm start
#### 4. Deploy the project and access it via the Railway-provided URL.
## API Endpoints
### 1. POST /start-crawl
  * Description: Initiates the crawling process.
###  Request Body:
      {
        "websites": ["<website-url-1>", "<website-url-2>"]
      }
###  Response:
      {
        "message": "Crawling initiated successfully.",
        "downloadLink": "<download-url>",
        "viewLink": "<view-url>"
      }
## 2. GET /download-data
* Description: Downloads the extracted data as a CSV file.
* Response: File download (product_urls.csv).
## 3. GET /view-data
* Description: Returns the extracted data in JSON format.
### Response:
    [
      { "url": "<product-url-1>" },
      { "url": "<product-url-2>" }
    ]
## Configuration
* File Path: Update <mark> FILE_PATH </mark> in the code to change the CSV file location.
* Concurrency: Adjust <mark> MAX_CONCURRENCY </mark> in the code to control the number of parallel browser instances.
* Depth: Modify <mark> MAX_DEPTH </mark> to control the depth of crawling.

## Limitations
* Crawls up to 10 websites at a time (configurable).
* May encounter challenges with highly dynamic websites using advanced JavaScript rendering.
## Future Improvements

* Add error handling and retry logic for failed URLs.
* Integrate with a database for storing large-scale results.
* Support for advanced filtering and extraction rules.

## License

* This project is licensed under the MIT License. Feel free to use and modify it as needed.
