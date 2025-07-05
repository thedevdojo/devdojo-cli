#!/usr/bin/env node
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');

// Get command line arguments
const args = process.argv.slice(2);

// Parse command line arguments for environment flag
let env = 'production'; // Default to production
let cleanArgs = [];

// Process arguments to extract environment flag
args.forEach(arg => {
  if (arg.startsWith('--env=')) {
    env = arg.split('=')[1].toLowerCase();
  } else {
    cleanArgs.push(arg);
  }
});

// Automatically disable SSL verification for non-production environments
const disableSSL = env !== 'production' && env !== 'prod';

// Set API URL based on environment
const API_URLS = {
  local: 'https://devdojo.test',
  dev: 'https://devdojo.test',  // Alias for local
  staging: 'https://staging.devdojo.com',  // Added staging environment
  production: 'https://devdojo.com',
  prod: 'https://devdojo.com'   // Alias for production
};

const API_URL = API_URLS[env] || API_URLS.production;

// Check if the command is 'verify'
if (cleanArgs[0] === 'verify') {
  const key = cleanArgs[1];
  if (key) {
    verifyKey(key);
  } else {
    console.log(chalk.red('Error: No key provided.'));
    console.log(chalk.yellow('Usage: npx devdojo verify <YourKey>'));
    console.log(chalk.blue('Optional: --env=local to use local development server'));
  }
} else {
  console.log(chalk.blue('Welcome to DevDojo CLI!'));
  console.log('Available commands:');
  console.log(chalk.green('  verify <YourKey>') + ' - Verify your DevDojo key');
  console.log('\nOptions:');
  console.log(chalk.green('  --env=local') + ' - Use local development server (default: production)');
}

async function verifyKey(key) {
  const spinner = ora(`Verifying your DevDojo key on ${env} environment...`).start();
  
  try {
    // Configure axios request
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add HTTPS agent with SSL verification disabled for non-production environments
    if (disableSSL) {
      const https = require('https');
      axiosConfig.httpsAgent = new https.Agent({ rejectUnauthorized: false });
      console.log(chalk.yellow(`SSL verification disabled for ${env} environment`));
    }
    
    console.log(`Sending request to: ${API_URL}/verify (${env} environment)`);
    // Use POST request for better security
    const response = await axios.post(`${API_URL}/verify`, { key }, axiosConfig);
    
    spinner.stop();
    
    console.log(chalk.yellow('Response received:'), JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(chalk.green('✓ Success! Your DevDojo account has been verified.'));
      console.log(chalk.blue('You can now continue using all DevDojo features.'));
    } else if (response.data.message) {
      console.log(chalk.red(`✗ ${response.data.message}`));
    } else {
      console.log(chalk.red('✗ Unexpected response format from server.'));
    }
  } catch (error) {
    spinner.stop();
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 429) {
        console.log(chalk.red('✗ Too many failed attempts. Please try again in 30 minutes.'));
      } else if (error.response.data && error.response.data.message) {
        console.log(chalk.red(`✗ ${error.response.data.message}`));
      } else {
        console.log(chalk.red(`✗ Verification failed. Status: ${error.response.status}`));
        console.log(chalk.yellow('Response data:'), error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log(chalk.red('✗ Unable to connect to DevDojo servers. Please check your internet connection and try again.'));
      console.log(chalk.yellow('Debug info:'));
      console.log(`- Target URL: ${API_URL}/verify`);
      console.log(`- Error code: ${error.code}`);
      
      // For local development with self-signed certificates
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.yellow('\nIt looks like the connection was refused. If you\'re using a local development domain,'));
        console.log(chalk.yellow('make sure your local server is running and the domain is accessible.'));
      } else if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        if (disableSSL) {
          console.log(chalk.yellow('\nSSL verification is already disabled, but there\'s still an SSL certificate issue.'));
          console.log(chalk.yellow('This might indicate a different problem with the server or network.'));
        } else {
          console.log(chalk.yellow('\nThere seems to be an SSL certificate issue with the production environment.'));
          console.log(chalk.yellow('Please report this issue to the DevDojo team.'));
        }
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(chalk.red('✗ An unexpected error occurred:'), error.message);
      // Log the full error for debugging
      console.log(chalk.yellow('Full error:'), error);
    }
  }
}