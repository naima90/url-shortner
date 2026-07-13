// Unit test for the click-event handler. The repository is mocked, so this
// runs fast and needs no database or SQS. It checks the logic: message
// parsing and mapping onto the repository write.
import { clickRepository } from '@url-shortner/db';
import { parseClickEventMessage, recordClickEvent } from '../../src/handlers/recordClickEvent';

jest.mock('@url-shortner/db', () => ({
  clickRepository: {
    create: jest.fn(),
  },
}));

const mockRepo = clickRepository as jest.Mocked<typeof clickRepository>;

describe('parseClickEventMessage', () => {
  it('parses a well-formed message body', () => {
    const body = JSON.stringify({
      linkId: 'l1',
      clickedAt: '2026-01-01T00:00:00.000Z',
      referrer: 'https://example.com',
      userAgent: 'test-agent',
      ipHash: 'abc123',
    });

    expect(parseClickEventMessage(body)).toEqual({
      linkId: 'l1',
      clickedAt: '2026-01-01T00:00:00.000Z',
      referrer: 'https://example.com',
      userAgent: 'test-agent',
      ipHash: 'abc123',
    });
  });

  it('rejects a message missing linkId', () => {
    const body = JSON.stringify({ clickedAt: '2026-01-01T00:00:00.000Z' });
    expect(() => parseClickEventMessage(body)).toThrow(/linkId/i);
  });
});

describe('recordClickEvent', () => {
  it('writes the click event via the repository', async () => {
    await recordClickEvent({
      linkId: 'l1',
      clickedAt: '2026-01-01T00:00:00.000Z',
      referrer: null,
      userAgent: null,
      ipHash: 'abc123',
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      linkId: 'l1',
      referrer: null,
      userAgent: null,
      ipHash: 'abc123',
    });
  });
});
