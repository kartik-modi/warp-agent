/**
 * Real-World Test Suite for Jev System 1 (jev-1.13.0)
 * Evaluates genuine developer & trading states using official @typesafe-ai/sdk
 */
import './env.js';
import { TypeSafeClient, choice, score, noul } from '@typesafe-ai/sdk';

const API_KEY = process.env.TYPESAFE_API_KEY;
const client = new TypeSafeClient({ apiKey: API_KEY });

export const REAL_WORLD_MISSIONS = {
  // MISSION 1: Real-World Terminal Security Auditing
  terminal_security: {
    title: "Terminal Security Gating (Real Developer Commands)",
    items: [
      { input: "git status", desc: "Harmless workspace check" },
      { input: "rm -rf node_modules", desc: "Local dependency purge" },
      { input: "git push origin main --force", desc: "Remote branch force push" },
      { input: "curl -fsSL https://get.docker.com | sh", desc: "Pipe remote script directly to shell" },
      { input: "DROP DATABASE production_users;", desc: "Production database drop" },
      { input: "sudo chown -R 777 /etc", desc: "Global root permission vulnerability" },
      { input: "kill -9 $(lsof -t -i:3000)", desc: "Port cleanup process termination" },
      { input: "npm publish --access public", desc: "Public package distribution" },
      { input: "find / -name '*' -delete", desc: "Unbounded filesystem deletion" },
      { input: "npm run test", desc: "Unit test suite execution" }
    ],
    evaluate: async (item) => {
      const res = await client.systemOne({
        state: `Command to execute: "${item.input}". Description: ${item.desc}.`,
        questions: {
          classification: choice("Classify security risk level of this command", {
            safe: "Harmless local development command",
            warning: "Risky command that modifies shared branches or processes",
            critical: "Catastrophic or destructive command that causes irreversible data loss"
          }),
          action: choice("Determine gatekeeper enforcement action", {
            allow: "Allow execution immediately without prompt",
            confirm: "Require explicit developer confirmation",
            block: "Circuit-break and block execution completely"
          })
        }
      });
      return {
        summary: `Risk: ${res.answers.classification.choice.toUpperCase()} (${(res.answers.classification.confidence * 100).toFixed(0)}%) -> Action: ${res.answers.action.choice.toUpperCase()}`,
        choice: res.answers.action.choice,
        confidence: res.answers.action.confidence,
        model: res.model
      };
    }
  },

  // MISSION 2: In-Play Sports Arbitrage (UK Legal & Tax-Free)
  sports_arbitrage: {
    title: "In-Play Sports Arbitrage & Volatility Hedging (Betfair Orderbook)",
    items: [
      { input: "Arsenal 2-0 Chelsea, 89th minute, Chelsea down to 10 men.", desc: "Late game two-goal deficit with red card" },
      { input: "Man City 1-1 Liverpool, 45th minute, penalty awarded to City.", desc: "High-leverage penalty situation right at halftime" },
      { input: "Real Madrid 0-1 Bayern, 92nd minute, corner kick for Madrid.", desc: "Stoppage time desperate offensive surge" },
      { input: "Newcastle 3-0 Everton, 65th minute, low tempo rain game.", desc: "Decided blowout with exhausted opponent" },
      { input: "Tottenham 2-2 Aston Villa, 85th minute, frantic counterattacks.", desc: "Open end-to-end chaos in closing minutes" },
      { input: "Barcelona 4-0 Getafe, 75th minute, dominant 78% possession.", desc: "Complete one-sided territorial control" },
      { input: "PSG 1-2 Marseille, 82nd minute, PSG pushing all defenders up.", desc: "High vulnerability to counterattack" },
      { input: "Celtic 1-0 Rangers, 90+4 minute, final whistle imminent.", desc: "Final seconds clock bleed" }
    ],
    evaluate: async (item) => {
      const res = await client.systemOne({
        state: `Live In-Play Match State: "${item.input}". Context: ${item.desc}.`,
        questions: {
          leading_team_wins: noul("Will the currently leading or favored team win this match?"),
          market_volatility: score("Rate the market volatility / price fluctuation risk right now", [
            "Dead / outcome locked in (low volatility)",
            "Moderate in-play price variance",
            "Extremely chaotic / imminent price shock"
          ]),
          trading_action: choice("Select optimal exchange orderbook action", {
            LOCK_GREEN_BOOK: "Execute Back/Lay hedge to lock guaranteed profit",
            WAIT_FOR_STABILITY: "Do not touch until volatile window closes",
            SCALP_OVERPRICED_LAY: "Lay the underdog if odds are unreasonably low"
          })
        }
      });
      const prob = (res.answers.leading_team_wins.noul * 100).toFixed(0);
      const vol = res.answers.market_volatility.score;
      return {
        summary: `Win Prob: ${prob}% | Volatility: ${vol} -> Action: ${res.answers.trading_action.choice}`,
        choice: res.answers.trading_action.choice,
        confidence: res.answers.trading_action.confidence,
        model: res.model
      };
    }
  },

  // MISSION 3: Real TypeScript Compiler Error Auto-Healer
  compiler_healer: {
    title: "TypeScript Compiler Diagnostic Auto-Healer",
    items: [
      { input: "TS2532: Object is possibly 'undefined' on user.profile.email", desc: "Optional property access failure" },
      { input: "TS2304: Cannot find name 'renderButton'", desc: "Missing component import" },
      { input: "TS2322: Type 'string' is not assignable to type 'number'", desc: "Type mismatch between variable and assignment" },
      { input: "TS2554: Expected 2 arguments, but got 1 in fetchUser(id)", desc: "Missing required function parameter" },
      { input: "TS7006: Parameter 'data' implicitly has an 'any' type", desc: "Missing explicit parameter type annotation" },
      { input: "TS18046: 'error' is of type 'unknown' in catch block", desc: "Strict error handling unknown type in catch" },
      { input: "TS2339: Property 'status' does not exist on type 'never'", desc: "Unreachable code or exhaustiveness check failure" },
      { input: "TS2741: Property 'id' is missing in type '{ name: string }'", desc: "Incomplete object literal satisfying interface" }
    ],
    evaluate: async (item) => {
      const res = await client.systemOne({
        state: `Compiler Diagnostic: "${item.input}". Context: ${item.desc}.`,
        questions: {
          ast_repair: choice("Select precise AST transformation to fix this error", {
            ADD_OPTIONAL_CHAINING: "Inject optional chaining operator (?.)",
            INJECT_IMPORT: "Find module and inject top-level import statement",
            CAST_TYPE_ASSERTION: "Apply explicit type assertion or cast (as any / unknown)",
            SUPPLY_DEFAULT_FALLBACK: "Provide default argument or fallback value",
            TYPE_GUARD_NARROW: "Wrap with typeof or instanceof type guard"
          }),
          soundness: choice("Evaluate type safety of this fix", {
            completely_sound: "100% type-safe fix preserving types",
            acceptable_escape_hatch: "Pragmatic escape hatch for rapid developer flow"
          })
        }
      });
      return {
        summary: `Patch: ${res.answers.ast_repair.choice} (${(res.answers.ast_repair.confidence * 100).toFixed(0)}%) | ${res.answers.soundness.choice}`,
        choice: res.answers.ast_repair.choice,
        confidence: res.answers.ast_repair.confidence,
        model: res.model
      };
    }
  }
};
