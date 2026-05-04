import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { AgentConfig, ResolvedAgentConfig } from '../types/agent-config.js';

export class ConfigLoader {
  private static instance: ConfigLoader;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!this.instance) {
      this.instance = new ConfigLoader();
    }
    return this.instance;
  }

  async load(agentDir: string): Promise<ResolvedAgentConfig> {
    const agentConfig = await this.readConfig(agentDir);
    const systemContext = await readFile(join(agentDir, agentConfig.prompts.system), 'utf-8');
    const agentContext = await this.resolveContext(agentDir, agentConfig.prompts.context);
    return { ...agentConfig, prompts: { system: systemContext, context: agentContext } };
  }

  private async readConfig(agentDir: string): Promise<AgentConfig> {
    const content = await readFile(join(agentDir, 'agent.json'), 'utf-8');
    return JSON.parse(content) as AgentConfig;
  }

  private async resolveContext(agentDir: string, contextPath: string): Promise<string> {
    const fullPath = join(agentDir, contextPath);
    const s = await stat(fullPath);

    if (s.isDirectory()) {
      const files = (await readdir(fullPath))
        .filter((f: string) => extname(f) === '.md')
        .sort();

      const sections = await Promise.all(
        files.map(async (f: string) => {
          const content = await readFile(join(fullPath, f), 'utf-8');
          return `\n--- ${f} ---\n${content}`;
        })
      );

      return sections.join('\n\n');
    }

    return readFile(fullPath, 'utf-8');
  }
}
