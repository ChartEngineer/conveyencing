const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const OWNER = "ChartEngineer";
const REPO = "conveyencing";
const BRANCH = "main";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("Set GITHUB_TOKEN in the environment before running this script.");
  process.exit(1);
}

const API = "https://api.github.com";
const repoRoot = path.join(__dirname, "..");

async function gh(method, endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "deeds360-deploy-script",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} -> ${res.status}: ${text}`);
  }
  return res.json();
}

async function bootstrapEmptyRepo() {
  console.log("Repository is empty — bootstrapping with an initial commit via the Contents API...");
  const result = await gh("PUT", `/repos/${OWNER}/${REPO}/contents/.gitkeep`, {
    message: "Bootstrap empty repository",
    content: Buffer.from("").toString("base64"),
    branch: BRANCH,
  });
  return result.commit.sha;
}

async function main() {
  const files = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  let parentSha;
  try {
    const ref = await gh("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    parentSha = ref.object.sha;
    console.log(`Existing branch found at ${parentSha}, will commit on top of it.`);
  } catch {
    parentSha = await bootstrapEmptyRepo();
  }

  console.log(`Uploading ${files.length} files as git blobs...`);

  const treeEntries = [];
  for (const file of files) {
    const fullPath = path.join(repoRoot, file);
    const content = fs.readFileSync(fullPath).toString("base64");
    const blob = await gh("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
      content,
      encoding: "base64",
    });
    treeEntries.push({ path: file.replace(/\\/g, "/"), mode: "100644", type: "blob", sha: blob.sha });
  }

  console.log("Creating tree...");
  const tree = await gh("POST", `/repos/${OWNER}/${REPO}/git/trees`, { tree: treeEntries });

  console.log("Creating commit...");
  const commit = await gh("POST", `/repos/${OWNER}/${REPO}/git/commits`, {
    message: "Deeds360 conveyancing suite",
    tree: tree.sha,
    parents: [parentSha],
  });

  console.log(`Updating refs/heads/${BRANCH}...`);
  await gh("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    sha: commit.sha,
    force: true,
  });

  console.log(`Done. Pushed commit ${commit.sha} to ${OWNER}/${REPO}@${BRANCH}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
