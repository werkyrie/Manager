// Firestore Rules
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write to all collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
    
    // Notes collection
    match /notes/{noteId} {
      allow read, write: if request.auth != null;
    }
    
    // Deleted notes collection
    match /deletedNotes/{noteId} {
      allow read, write: if request.auth != null;
    }
    
    // Settings collection
    match /settings/{settingId} {
      allow read, write: if request.auth != null;
    }
  }
}
`

// Storage Rules
const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read and write to all storage paths
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Receipts folder
    match /receipts/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                    request.resource.size < 5 * 1024 * 1024 && // 5MB max
                    request.resource.contentType.matches('image/.*'); // Only images
    }
  }
}
`

console.log("Firestore Rules:")
console.log(firestoreRules)
console.log("\nStorage Rules:")
console.log(storageRules)

// Export the rules for deployment
module.exports = {
  firestoreRules,
  storageRules,
}
