const { BlobServiceClient } = require("@azure/storage-blob");
const account = process.env.AZURE_STORAGE_ACCOUNT;
const key   = process.env.AZURE_STORAGE_KEY;
const svc   = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  { accountName: account, accountKey: key }
);
const containers = [
  { name: "entities",        public: false },
  { name: "institut-photos", public: true  },
  { name: "id-documents",    public: false },
  { name: "logs",            public: false }
];
async function main() {
  for (const c of containers) {
    const client = svc.getContainerClient(c.name);
    await client.createIfNotExists({ publicAccess: c.public ? "blob" : undefined });
    console.log("✅ container", c.name, c.public ? "public" : "private");
  }
}
main().catch(console.error);