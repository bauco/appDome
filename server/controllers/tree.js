const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
let ws;

// When a client connects to the WebSocket server, we capture the ws instance
wss.on('connection', (socket) => {
  ws = socket;
});
const writeQueue = {};  // A queue to manage file write operations by category
function sanitizeCategory(input) {
  // Basic sanitization: remove any non-alphanumeric characters (whitelist approach)
  const sanitizedInput = input.replace(/[^a-zA-Z0-9]/g, "");
  
  // Further validate against allowed categories
  if (input === sanitizedInput) {
    return sanitizedInput;
  } else {
    console.warn(`Rejected invalid or malicious category: ${input}`);
    return null; // or handle as per your requirement, e.g., set a default value
  }
}
// Function to validate each node in the tree
function validateNode(node) {
  if(node.category){
    node.category = sanitizeCategory(node.category);
    if(!node.category){
      return 'Node "category" is required and must be a valid string';
    }
  }
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
        if (ws) {  // Assuming `ws` is your WebSocket instance
          
          ws.send(JSON.stringify({ action: 'getTree' }));
        }
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


// Function to read data from files based on the category
async function readFromFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);  // Return parsed JSON data
    }
    return [];  // Return an empty array if the file doesn't exist
  } catch (error) {
    throw new Error(`Failed to read from file at ${filePath}: ${error.message}`);
  }
}

// Helper function to build the menu structure with hierarchical identifiers
function buildMenuStructure(items) {
  const menuMap = new Map();
  
  // Create a map of item by id
  items.forEach(item => {
    menuMap.set(item.id, {
      identifier: item.id.toString(), // Set identifier as a string
      label: item.label,
      iconName: item.iconName,
      iconFill: item.iconFill || false, // Default to false if undefined
      children: [],
      active: item.active,
      category: item.category,
      parentId: item.parentId
    });
  });

  // Build the nested structure based on parentId
  const result = [];

  items.forEach(item => {
    const menuItem = menuMap.get(item.id);

    if (item.parentId === 0) {
      result.push(menuItem);
    } else {
      const parent = menuMap.get(item.parentId);
      if (parent) {
        parent.children.push(menuItem);
      }
    }
  });

  // Assign hierarchical identifiers for nested items
  function assignIdentifiers(menu, parentIdentifier = '') {
    menu.forEach((item, index) => {
      const newIdentifier = parentIdentifier ? `${parentIdentifier}.${index + 1}` : `${index + 1}`;
      item.identifier = newIdentifier;
      
      // Recursively assign identifiers to children
      if (item.children.length > 0) {
        assignIdentifiers(item.children, newIdentifier);
      }
    });
  }

  assignIdentifiers(result);

  return result;
}

// Function to recursively transform the data
function transformMenuData(data) {
  const transformItem = (item, parentId = 0) => {
    return {
      identifier: item.identifier,
      label: item.label,
      iconName: item.iconName,
      children: item.children && item.children.length > 0 ? item.children.map(child => transformItem(child, item.identifier)) : [],
      active: item.active,
      category: item.category,
      parentId: parentId
    };
  };

  const transformedData = Object.keys(data).map(categoryId => {
    return {
      identifier: categoryId,
      label: `Category ${categoryId}`, // Assuming category names are dynamically determined
      iconName: 'category', // Default icon for the category
      children: data[categoryId].map(item => transformItem(item))
    };
  });

  return transformedData;
}


// GET Method: Read the tree data from files and return as JSON
exports.getTree = async (req, res) => {
  try {
    const publicDir = path.join(path.dirname(path.dirname(process.mainModule.filename)), 'server', 'public');
    
    // Read the filenames in the public directory
    const files = await fs.promises.readdir(publicDir);

    // Filter only the JSON files (categories)
    const categoryFiles = files.filter(file => file.endsWith('.json'));

    if (categoryFiles.length === 0) {
      res.status(404).json({ error: 'No tree data found' });
      return;
    }

    // Initialize the result object
    const result = {};

    // Read data from each category file and add it to the result object
    for (const file of categoryFiles) {
      const category = path.basename(file, '.json'); // Get the category name (filename without extension)
      const filePath = path.join(publicDir, file);
      const data = await readFromFile(filePath);

      // Build the hierarchical structure and add it to the result
      result[category] = buildMenuStructure(data);
      
    }

    // Return the transformed data
    res.json(transformMenuData(result));

  } catch (error) {
    console.error('Error retrieving the tree data:', error);
    res.status(500).json({ error: 'Failed to retrieve the tree data' });
  }
};
