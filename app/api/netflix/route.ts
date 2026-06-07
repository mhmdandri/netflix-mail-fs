import { NetflixEmail } from "@/types/netflix-email";
import imaps from "imap-simple";
import { simpleParser } from "mailparser";

interface ImapPart {
  which: string;
  body: string;
}

interface ImapMessage {
  parts: ImapPart[];
}

const imapConfig = {
  imap: {
    user: process.env.GMAIL_USER!,
    password: process.env.GMAIL_APP_PASSWORD!,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false,
    },
    authTimeout: 10000,
  },
};

export async function GET() {
  try {
    const connection = await imaps.connect(imapConfig);

    await connection.openBox("INBOX");

    const searchCriteria = [["FROM", "info@account.netflix.com"]];

    const fetchOptions = {
      bodies: [""],
      struct: true,
      markSeen: false,
    };

    const messages = (await connection.search(
      searchCriteria,
      fetchOptions,
    )) as ImapMessage[];

    const emails: NetflixEmail[] = [];

    for (const message of messages) {
      const fullMessage = message.parts.find((part) => part.which === "");

      if (!fullMessage) {
        continue;
      }

      const parsed = await simpleParser(fullMessage.body);

      emails.push({
        subject: parsed.subject,
        from: parsed.from?.text,
        date: parsed.date,
        text: parsed.text,
        html: typeof parsed.html === "string" ? parsed.html : false,
      });
    }

    connection.end();

    emails.sort((a, b) => {
      const dateA = a.date?.getTime() ?? 0;
      const dateB = b.date?.getTime() ?? 0;

      return dateB - dateA;
    });

    return Response.json(emails);
  } catch (error: unknown) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}
