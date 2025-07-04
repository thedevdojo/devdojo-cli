#!/usr/bin/env node
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');

// Get command line arguments
const args = process.argv.slice(2);

// Base URL for API requests
const API_URL = 'https://devdojo.com';

// Check if the command is 'verify'
if (args[0] === 'verify') {
  const key = args[1];
  if (key) {
    verifyKey(key);
  } else {
    console.log(chalk.red('Error: No key provided.'));
    console.log(chalk.yellow('Usage: npx devdojo verify <YourKey>'));
  }
} else {
  console.log(chalk.blue('Welcome to DevDojo CLI!'));
  console.log('Available commands:');
  console.log(chalk.green('  verify <YourKey>') + ' - Verify your DevDojo key');
}

async function verifyKey(key) {
  const spinner = ora('Verifying your DevDojo key...').start();
  
  try {
    const response = await axios.post(`${API_URL}/verify`, { key });
    
    spinner.stop();
    
    if (response.data.success) {
      console.log(chalk.green('✓ Success! Your DevDojo account has been verified.'));
      console.log(chalk.blue('You can now continue using all DevDojo features.'));
    } else {
      console.log(chalk.red(`✗ ${response.data.message}`));
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
        console.log(chalk.red('✗ Verification failed. Please check your key and try again.'));
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log(chalk.red('✗ Unable to connect to DevDojo servers. Please check your internet connection and try again.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log(chalk.red('✗ An unexpected error occurred. Please try again later.'));
    }
  }
}