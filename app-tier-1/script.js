const { exec } = require("child_process");

// Function to execute a command and return a Promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });

    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
  });
}

// root = "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER-LOCAL";
root = "/home/ubuntu/app-tier";
async function main() {
  try {
    // Execute the commands sequentially
    await executeCommand(`cd ${root}/controller && node request.js`);
    await executeCommand(
      `cd ${root}/classifier && find ./ -type f \\( -iname \\*.JPEG -o -iname \\*.jpg -o -iname \\*.png \\) | xargs python3 image_classification.py`
    );
    await executeCommand(`cd ${root}/controller && node response.js`);

    // All commands have completed
    console.log("All commands have finished.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
