const fs = require('fs');
const path = require('path');

const writeQueue = {};  // A queue to manage file write operations by category

// Function to validate each node in the tree
function validateNode(node) {
  if (typeof node.id !== 'number') {
    return 'Node "id" is required and must be a number';
  }
  if (typeof node.label !== 'string') {
    return 'Node "label" is required and must be a string';
  }
  if (typeof node.active !== 'boolean') {
    return 'Node "active" is required and must be a boolean';
  }
  if (node.children && !Array.isArray(node.children)) {
    return 'Node "children" must be an array if present';
  }
  return null;  // No errors
}

// Recursive function to validate the entire tree structure
function validateTree(tree) {
  for (let node of tree) {
    const error = validateNode(node);
    if (error) return error;

    if (node.children) {
      const childError = validateTree(node.children);
      if (childError) return childError;
    }
  }
  return null;  // Tree is valid
}

// Utility function to recursively process the tree and set parentId
function processTree(node, result, parentId = 0) {
  if (!node || !node.active) return;

  // Set parentId for the current node
  node.parentId = parentId;

  // Aggregate nodes by category
  if (!result[node.category]) {
    result[node.category] = [];
  }

  // Filter out inactive children
  node.children = node.children.filter(child => child.active);
  result[node.category].push(node);

  // Recursively process children nodes
  if (node.children) {
    node.children.forEach(child => processTree(child, result, node.id));  // Pass the current node's id as the parentId for the children
  }
}

// Utility function to recursively handle the removal of duplicates and maintain children
function removeDuplicates(items, existingIds, seenNodes = new Set()) {
  return items
    .filter(item => {
      // Check if the current item's ID already exists in the existing data
      const isDuplicate = existingIds.has(item.id);
      // If it's not a duplicate, add it to the set
      if (!isDuplicate) existingIds.add(item.id);
      return !isDuplicate;
    })
    .map(item => {
      // Avoid circular references by checking if the node has already been processed
      if (seenNodes.has(item.id)) {
        return null;  // Skip this node as it is part of a cycle
      }
      seenNodes.add(item.id); // Mark this node as processed

      // Recursively handle children and set parentId
      if (item.children && item.children.length > 0) {
        // Remove duplicates from children
        item.children = removeDuplicates(item.children, existingIds, seenNodes);
      }

      return item;  // Return the processed node
    })
    .filter(item => item !== null);  // Remove any nodes that were skipped due to circular reference
}

async function writeToFileQueue(category, data) {
  if (!writeQueue[category]) writeQueue[category] = [];
  return new Promise((resolve, reject) => {
    writeQueue[category].push(async () => {
      const filePath = path.join(path.dirname(path.dirname(process.mainModule.filename)), 'server', 'public', `${category}.json`);

      try {
        // Read the existing data from the file, if it exists
        let existingData = [];
        if (fs.existsSync(filePath)) {
          const fileContent = await fs.promises.readFile(filePath, 'utf-8');
          existingData = JSON.parse(fileContent);
        }
        // Remove duplicates and circular references from the incoming data
        const existingIds = new Set(existingData.map(item => item.id));
        const newData = removeDuplicates(data, existingIds);

        // Merge existing data with the new data (without duplicates)
        const updatedData = existingData.concat(newData);
        // Write the updated data back to the file
        await fs.promises.writeFile(filePath, JSON.stringify(updatedData, null, 2));
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        // Ensure that the queue continues processing
        writeQueue[category].shift();
        if (writeQueue[category].length > 0) writeQueue[category][0]();
      }
    });

    // Start processing the queue if this is the first item
    if (writeQueue[category].length === 1) writeQueue[category][0]();
  });
}


exports.createTree = async (req, res, next) => {
  try {
    const tree = req.body;
    console.log(tree);

    // Validate the request payload
    if (!Array.isArray(tree)) {
      res.status(400).json({ error: 'Tree payload must be an array' });
      return;
    }
    const err = validateTree(tree);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const result = {};

    // Process each node in the tree
    tree.forEach(node => processTree(node, result));

    // Write results to separate JSON files by category
    const promises = Object.keys(result).map(category => {
      return writeToFileQueue(category, result[category]);
    });

    // Handle multiple requests concurrently
    Promise.all(promises)
      .then(() => {
        res.json({ message: 'Tree processed and data saved to JSON files.' });
      })
      .catch(error => {
        console.error('Error writing files:', error);
        res.status(500).json({ error: 'Failed to write files' });
      });
  } catch (error) {
    console.error('Error processing the tree:', error);
    res.status(500).json({ error: 'Failed to process the tree' });
  }
}