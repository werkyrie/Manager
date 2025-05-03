rules_version = "2"
\
service cloud.firestore
{
  match / databases / { database } / documents
  {
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null
    }

    // Check if user is the owner of the document
    function isOwner(userId) {
      return request.auth.uid == userId
    }

    // Transactions collection
    match / transactions / { transactionId }
    allow
    read, write
    :
    if isAuthenticated();

    // Notes collection
    match / notes / { noteId }
    allow
    read, write
    :
    if isAuthenticated();

    // Deleted Notes collection
    match / deletedNotes / { noteId }
    allow
    read, write
    :
    if isAuthenticated();

    // Settings collection (for labels)
    match / settings / { settingId }
    allow
    read, write
    :
    if isAuthenticated();

    // User profiles
    match / users / { userId }
    allow
    read, write
    :
    if isAuthenticated() && isOwner(userId);
  }
}

service
firebase.storage
{
  match / b / { bucket } / o
  // Receipts folder
  match / receipts / { fileName }
  allow
  if request.auth != null;
  allow
  if request.auth != null && 
                    request.resource.size < 5 * 1024 * 1024 && // 5MB max
                    request.resource.contentType.matches('image/.*'); // Only images

  // User uploads
  match / users / { userId } / { fileName }
  allow
  if request.auth != null;
  allow
  if request.auth != null && request.auth.uid == userId;
}
