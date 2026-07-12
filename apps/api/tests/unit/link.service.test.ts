// Unit tests for link.service. The repository is mocked, so these run fast and
// need no database. They check the logic: reserved-alias rejection, collision
// retry, and ownership enforcement on delete.
import { linkService } from '../../src/services/link.service';
import { linkRepository } from '../../src/repositories/link.repository';

// Replace the repository with jest mocks.
jest.mock('../../src/repositories/link.repository', () => ({
  linkRepository: {
    findByCode: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    listByOwner: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockRepo = linkRepository as jest.Mocked<typeof linkRepository>;

describe('linkService.create', () => {
  it('rejects a reserved custom alias', async () => {
    await expect(linkService.create('user1', 'https://a.com', 'admin')).rejects.toThrow(
      /reserved/i,
    );
  });

  it('rejects a custom alias that is already taken', async () => {
    mockRepo.findByCode.mockResolvedValueOnce({ id: 'x' } as never);
    await expect(linkService.create('user1', 'https://a.com', 'mylink')).rejects.toThrow(
      /already taken/i,
    );
  });

  it('creates a link with a custom alias when it is free', async () => {
    mockRepo.findByCode.mockResolvedValueOnce(null);
    mockRepo.create.mockResolvedValueOnce({
      id: 'l1',
      code: 'mylink',
      isCustomAlias: true,
      originalUrl: 'https://a.com',
      createdAt: new Date(),
      expiresAt: null,
    } as never);

    const link = await linkService.create('user1', 'https://a.com', 'mylink');
    expect(link.code).toBe('mylink');
    expect(link.isCustomAlias).toBe(true);
    expect(link.clickCount).toBe(0);
  });
});

describe('linkService.generateUniqueCode', () => {
  it('retries when the first generated code collides', async () => {
    // First candidate is taken, second is free.
    mockRepo.findByCode
      .mockResolvedValueOnce({ id: 'taken' } as never)
      .mockResolvedValueOnce(null);

    const code = await linkService.generateUniqueCode();
    expect(typeof code).toBe('string');
    expect(mockRepo.findByCode).toHaveBeenCalledTimes(2);
  });
});

describe('linkService.delete', () => {
  it('refuses to delete a link the user does not own', async () => {
    mockRepo.findById.mockResolvedValueOnce({ id: 'l1', ownerId: 'someone-else' } as never);
    await expect(linkService.delete('user1', 'l1')).rejects.toThrow(/do not own/i);
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('deletes a link the user owns', async () => {
    mockRepo.findById.mockResolvedValueOnce({ id: 'l1', ownerId: 'user1' } as never);
    mockRepo.delete.mockResolvedValueOnce({} as never);
    await linkService.delete('user1', 'l1');
    expect(mockRepo.delete).toHaveBeenCalledWith('l1');
  });
});
