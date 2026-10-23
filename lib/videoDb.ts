const DB_NAME =
  "vlearning-studio-db";

const DB_VERSION =
  1;

const VIDEO_STORE =
  "videos";

/* =========================================================
   OPEN DATABASE
========================================================= */

function openDatabase(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onerror =
        () => {
          console.error(
            "[VIDEO DB] Không mở được IndexedDB:",
            request.error
          );

          reject(
            request.error
          );
        };

      request.onupgradeneeded =
        () => {
          const db =
            request.result;

          if (
            !db.objectStoreNames.contains(
              VIDEO_STORE
            )
          ) {
            db.createObjectStore(
              VIDEO_STORE
            );
          }
        };

      request.onsuccess =
        () => {
          resolve(
            request.result
          );
        };
    }
  );
}

/* =========================================================
   SAVE VIDEO

   Quan trọng:
   Chỉ resolve khi transaction.oncomplete.
   Không resolve sớm tại request.onsuccess.
========================================================= */

export async function saveVideo(
  pageId: string,
  file: File
): Promise<void> {
  const db =
    await openDatabase();

  try {
    await new Promise<void>(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            VIDEO_STORE,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            VIDEO_STORE
          );

        const request =
          store.put(
            file,
            pageId
          );

        request.onerror =
          () => {
            console.error(
              "[VIDEO DB] store.put lỗi:",
              request.error
            );
          };

        transaction.oncomplete =
          () => {
            console.log(
              "[VIDEO DB] ✅ Đã lưu video:",
              {
                pageId,
                fileName:
                  file.name,
                fileSize:
                  file.size,
                fileType:
                  file.type,
              }
            );

            resolve();
          };

        transaction.onerror =
          () => {
            console.error(
              "[VIDEO DB] ❌ Transaction lỗi:",
              transaction.error
            );

            reject(
              transaction.error ??
                new Error(
                  "Không thể lưu video."
                )
            );
          };

        transaction.onabort =
          () => {
            console.error(
              "[VIDEO DB] ❌ Transaction bị hủy:",
              transaction.error
            );

            reject(
              transaction.error ??
                new Error(
                  "Transaction lưu video bị hủy."
                )
            );
          };
      }
    );
  } finally {
    db.close();
  }
}

/* =========================================================
   GET VIDEO
========================================================= */

export async function getVideo(
  pageId: string
): Promise<File | null> {
  const db =
    await openDatabase();

  try {
    return await new Promise<
      File | null
    >(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            VIDEO_STORE,
            "readonly"
          );

        const store =
          transaction.objectStore(
            VIDEO_STORE
          );

        const request =
          store.get(
            pageId
          );

        request.onsuccess =
          () => {
            const result =
              request.result;

            if (
              result instanceof
              File
            ) {
              resolve(
                result
              );

              return;
            }

            if (
              result instanceof
              Blob
            ) {
              resolve(
                new File(
                  [result],
                  "video.mp4",
                  {
                    type:
                      result.type ||
                      "video/mp4",
                  }
                )
              );

              return;
            }

            resolve(
              null
            );
          };

        request.onerror =
          () => {
            console.error(
              "[VIDEO DB] Không đọc được video:",
              request.error
            );

            reject(
              request.error
            );
          };
      }
    );
  } finally {
    db.close();
  }
}

/* =========================================================
   DELETE VIDEO
========================================================= */

export async function deleteVideo(
  pageId: string
): Promise<void> {
  const db =
    await openDatabase();

  try {
    await new Promise<void>(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            VIDEO_STORE,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            VIDEO_STORE
          );

        store.delete(
          pageId
        );

        transaction.oncomplete =
          () => {
            resolve();
          };

        transaction.onerror =
          () => {
            reject(
              transaction.error
            );
          };

        transaction.onabort =
          () => {
            reject(
              transaction.error
            );
          };
      }
    );
  } finally {
    db.close();
  }
}

/* =========================================================
   DEBUG / VERIFY VIDEO

   Dùng để kiểm tra sau khi lưu.
========================================================= */

export async function hasVideo(
  pageId: string
): Promise<boolean> {
  const file =
    await getVideo(
      pageId
    );

  return Boolean(
    file
  );
}