#!/usr/bin/env node

// Get command line arguments
const args = process.argv.slice(2);

// Check if the command is 'verify'
if (args[0] === 'verify') {
  const key = args[1];
  if (key) {
    console.log(`Verifying key: ${key}`);
    // Here you would add your actual verification logic
  } else {
    console.log('Error: No key provided. Usage: npx devdojo verify <YourKey>');
  }
} else {
  console.log('Welcome to DevDojo CLI!');
  console.log('Available commands:');
  console.log('  verify <YourKey> - Verify your DevDojo key');
}