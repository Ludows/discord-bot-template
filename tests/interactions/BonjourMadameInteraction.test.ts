import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BonjourMadameInteraction } from '../../src/interactions/BonjourMadameInteraction';
import { Message } from 'discord.js';

const mockMessage = (roles: string[] = []) => ({
  author: { bot: false, tag: 'user#0001' },
  member: {
    permissions: { has: vi.fn().mockReturnValue(true) },
    roles: { cache: roles.map(name => ({ name })) }
  },
  reply: vi.fn().mockResolvedValue({ delete: vi.fn(), createdTimestamp: Date.now() }),
  createdTimestamp: Date.now(),
}) as unknown as Message;

describe('BonjourMadameInteraction', () => {
  let interaction: BonjourMadameInteraction;
  let message: Message;

  beforeEach(() => {
    interaction = new BonjourMadameInteraction();
    message = mockMessage();
    vi.clearAllMocks();
  });

  it('getName retourne le bon nom', () => {
    expect(interaction.getName()).toBe('bonjourmadame');
  });

  it('--help retourne l\'aide', async () => {
    await interaction.handle(message, ['--help']);
    expect(message.reply).toHaveBeenCalled();
  });

  it('execute est appelée sans argument', async () => {
    const spy = vi.spyOn(interaction, 'execute').mockResolvedValue(undefined);
    await interaction.handle(message, []);
    expect(spy).toHaveBeenCalledOnce();
  });

  // TODO: Ajoutez ici les tests pour la méthode d'exécution principale de BonjourMadameInteraction

});
