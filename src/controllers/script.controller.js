const express = require("express");
const router = express.Router();
const ScriptModel = require("../models/script.model");
const UserModel = require("../models/user.model");

// Using old ahh color escape methodes, cause foreground is only on powershell
const header_warnings = {
    execution_reminder: `\x1b[33m
    +----------------------------------------+
    |      You're executing a script         |
    |    Virtually everything is possible    |
    |    Make sure you trust the source      |
    |----------------------------------------|
    |   You can manually browse the script   |
    |     by puting it on any web browser    |
    +----------------------------------------+
    \x1b[0m`
}

// Don't think this works on normal terminal
const powershell_prompt_template = `
function Confirm-Continue {
    param (
        [string]$Message = "Do you want to continue?"
    )

    while ($true) {
        $input = Read-Host "$Message [Y/n]"
        switch ($input.Trim().ToLower()) {
            "y" { return $true }
            ""  { return $true }  # Enter = yes by default
            "n" {
                Write-Host "Operation cancelled." -ForegroundColor Yellow
                exit 0
            }
            default {
                Write-Host "Invalid input. Please enter Y or N." -ForegroundColor Red
            }
        }
    }
}

# Usage
Confirm-Continue -Message "This script will install applications on your system."
Write-Host " Proceeding with installation... " -ForegroundColor Green
`

// ---------------------------------------------------------------------------
// OS detection helpers
// ---------------------------------------------------------------------------

/**
 * Filter out user agent to get current OS
 * @param {string} user_agent  - req.headers['user-agent']
 * @returns {"windows"|"linux"|"macos"|"unknown"}
 */
const detectOS = (user_agent = "") => {
    const s = user_agent.toLowerCase();
    
    switch (true) {
        case s.includes("windows"):
            return "windows";
        case s.includes("darwin") || s.includes("mac os"):
            return "macos";
        case s.includes("linux"):
            return "linux";
        default:
            return "unknown";
    }
}

/**
 * Checks if its any kind of terminal binary making the call
 * @param {string} user_agent
 * @returns {boolean}
 */
function isTerminalClient(user_agent = "") {
    const s = user_agent.toLowerCase();
    console.log(s)
    return (
        s.includes("curl") ||
        s.includes("wget") ||
        s.includes("powershell") ||
        s.includes("windowspowershell") ||
        s.includes("invoke-webrequest") ||
        s.includes("python-requests") ||
        // irm (Invoke-RestMethod) sends no typical browser UA
        (!s.includes("mozilla") && !s.includes("webkit"))
    );
}

// ---------------------------------------------------------------------------
// Script renderers
// ---------------------------------------------------------------------------


//TODO Send full uncensorred script rn. add verification and prompt's for confirmation
/**
 * Build a PowerShell script string from a list of commands.
 * @param {Script} script
 * @returns {string}
 */
const renderPowerShell = (script) => {
    const header = [
        `# ${script.name}`,
        script.description ? `# ${script.description}` : null,
        `echo "${header_warnings.execution_reminder}"`,
        "",
    ]
        .filter((l) => l !== null) //checks for empty script part
        .join("\n");  // From array to string with lignbreak

    const body = script.content.join("\n"); // execute + lignebreak
    return `${header}${powershell_prompt_template}${body}\n`;
}

/**
 * Setup bash laucnh's
 * @param {Script} script
 * @returns {string}
 */
const renderBash = (script) => {
    const header = [
        "#!/usr/bin/env bash",
        `# ${script.name}`,
        script.description ? `# ${script.description}` : null,
        // header_warnings.execution_reminder,
        "set -euo pipefail", //-e stop execussion on error, -u variables that dont exist's are errors, -o make ``cmd1 | cm2`` cmd1 error detectable
        "",
    ]
        .filter((l) => l !== null)
        .join("\n"); //strinfigy

    const body = script.content.join("\n");
    return `${header}${body}\n`;
}

//TODO webUI is Claude made. Make it yourself dummy
//! Wait for Artistic direction decision. 
/**
 * Build an HTML page for browser preview.
 * @param {Script} script
 * @param {string} publicUrl  - full URL to the raw script endpoint
 * @returns {string}
 */
function renderHTML(script, publicUrl) {
    const escapedCommands = script.content
        .map(
            (cmd, i) =>
                `<tr>
          <td class="line-num">${i + 1}</td>
          <td class="cmd">${escapeHtml(cmd)}</td>
        </tr>`
        )
        .join("\n"); //generate table from scripts

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(script.name)} — Winget-Serv</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      padding: 2rem;
    }
    header { margin-bottom: 1.5rem; }
    h1 { font-size: 1.5rem; color: #e6edf3; }
    .description { margin-top: 0.4rem; color: #8b949e; font-size: 0.95rem; }
    .meta { margin-top: 0.25rem; color: #6e7681; font-size: 0.8rem; }

    .run-box {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }
    .run-box h2 { font-size: 0.9rem; color: #8b949e; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: .05em; }
    .tab-bar { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .tab {
      padding: 0.3rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #30363d;
      background: transparent;
      color: #8b949e;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .tab.active { background: #1f6feb; border-color: #1f6feb; color: #fff; }
    .code-block {
      display: none;
      background: #0d1117;
      border: 1px solid #21262d;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #79c0ff;
      position: relative;
    }
    .code-block.visible { display: block; }
    .copy-btn {
      position: absolute;
      top: 0.5rem; right: 0.5rem;
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
      border-radius: 4px;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .copy-btn:hover { background: #30363d; }

    .script-table {
      width: 100%;
      border-collapse: collapse;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
    }
    .script-table th {
      text-align: left;
      padding: 0.6rem 1rem;
      background: #1c2128;
      color: #8b949e;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: .05em;
      border-bottom: 1px solid #30363d;
    }
    .script-table td { padding: 0.45rem 1rem; border-bottom: 1px solid #21262d; }
    .script-table tr:last-child td { border-bottom: none; }
    .line-num { color: #6e7681; font-size: 0.8rem; width: 2.5rem; font-family: monospace; }
    .cmd { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 0.9rem; color: #a5d6ff; }

    .warning {
      margin-top: 1.5rem;
      padding: 0.75rem 1rem;
      background: #161b22;
      border-left: 3px solid #d29922;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #e3b341;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(script.name)}</h1>
    ${script.description ? `<p class="description">${escapeHtml(script.description)}</p>` : ""}
    <p class="meta">ID: <code>${escapeHtml(script.public_id)}</code> &nbsp;·&nbsp; ${script.content.length} command${script.content.length !== 1 ? "s" : ""}</p>
  </header>

  <div class="run-box">
    <h2>Run this script</h2>
    <div class="tab-bar">
      <button class="tab active" onclick="showTab('ps')">PowerShell</button>
      <button class="tab" onclick="showTab('bash')">Bash / zsh</button>
    </div>

    <div id="tab-ps" class="code-block visible">
      <button class="copy-btn" onclick="copyCode('tab-ps')">Copy</button>
      irm ${escapeHtml(publicUrl)} | iex
    </div>
    <div id="tab-bash" class="code-block">
      <button class="copy-btn" onclick="copyCode('tab-bash')">Copy</button>
      curl -fsSL ${escapeHtml(publicUrl)} | bash
    </div>
  </div>

  <table class="script-table">
    <thead>
      <tr>
        <th>#</th>
        <th>Command</th>
      </tr>
    </thead>
    <tbody>
      ${escapedCommands}
    </tbody>
  </table>

  <p class="warning">⚠️ Always review the commands above before running any script from the internet.</p>

  <script>
    function showTab(name) {
      document.querySelectorAll('.code-block').forEach(el => el.classList.remove('visible'));
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('visible');
      event.currentTarget.classList.add('active');
    }
    function copyCode(id) {
      const text = document.getElementById(id).innerText.replace('Copy', '').trim();
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('#' + id + ' .copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      });
    }
  </script>
</body>
</html>`;
}

// remplace any raw characters by their HTML friendly one
const escapeHtml = (str = "") => {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /script/:public_id
 *
 * - Terminal client  → returns raw script (PS1 or SH) based on User-Agent or ?os=
 * - Browser client   → returns HTML preview page
 *
 * Optional query param: ?os=win|linux|macos  (overrides UA detection)
 */
const getScript = async (req, res) => {
    try {
        const script = await ScriptModel.findByPublicId(req.params.public_id);

        if (!script) {
            return res.status(404).json({ error: "Script not found." });
        }

        // boolean for if client is terminal
        const user_agent = req.headers["user-agent"] || "";
        const terminal = isTerminalClient(user_agent);

        // OS confirmation
        const osOverride = (req.query.os || "").toLowerCase();
        let os = detectOS(user_agent);
        if (osOverride === "win" || osOverride === "windows") os = "windows";
        else if (osOverride === "linux") os = "linux";
        else if (osOverride === "mac" || osOverride === "macos") os = "macos";

        if (terminal || osOverride) {
            // --- Raw script delivery ---
            if (os === "windows") {
                res.setHeader("Content-Type", "text/plain; charset=utf-8");
                return res.send(renderPowerShell(script));
            } else {
                // linux, macos, unknown → bash
                res.setHeader("Content-Type", "text/plain; charset=utf-8");
                return res.send(renderBash(script));
            }
        }

        // Browser preview. mandatory shenanigans for testing (in http environement)
        // and deployability compatibility
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const publicUrl = `${baseUrl}/script/${script.public_id}`;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(renderHTML(script, publicUrl));

    } catch (err) {
        console.error("[script.controller] GET /:public_id", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * POST /script/create
 * Body: { name, description?, content: string[] }
 * Requires authentication.
 */
const createScript = async (req, res) => {
    const { name, description, content } = req.body;

    if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Field 'name' is required." });
    }
    if (!Array.isArray(content) || content.length === 0) {
        return res
            .status(400)
            .json({ error: "Field 'content' must be a non-empty array of strings." });
    }
    if (!content.every((c) => typeof c === "string")) {
        return res
            .status(400)
            .json({ error: "All commands in 'content' must be strings." });
    }

    try {
        const script = await ScriptModel.create({
            name: name.trim(),
            description: description?.trim() || null,
            content,
            user_id: req.userId, // set by requireAuth middleware
        });

        return res.status(201).json(script);
    } catch (err) {
        console.error("[script.controller] POST /create", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * DELETE /script/remove
 * Body: { id: number }
 * Users can only delete their own scripts.
 */
const deleteScript = async (req, res) => {
    const id = Number(req.body.id);

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "Field 'id' must be a valid number." });
    }

    try {
        const script = await ScriptModel.findById(id);

        if (!script) {
            return res.status(404).json({ error: "Script not found." });
        }
        
        // Admins can delete any script; regular users only their own
        const user = await UserModel.getById(req.userId);
        const isAdmin = user.role_name === "admin";
        if (!isAdmin && script.user_id !== req.userId) {
            return res.status(403).json({ error: "Forbidden." });
        }

        await ScriptModel.remove(id);
        return res.status(200).json({ message: "Script deleted successfully." });
    } catch (err) {
        console.error("[script.controller] DELETE /remove", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

/**
 * GET /script/list
 * Returns all scripts belonging to the authenticated user.
 */
const getAllUserScript = async (req, res) => {
    try {
        const scripts = await ScriptModel.findAllByUser(req.userId);
        return res.status(200).json(scripts);
    } catch (err) {
        console.error("[script.controller] GET /list", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    getScript,
    createScript,
    deleteScript,
    getAllUserScript
};
