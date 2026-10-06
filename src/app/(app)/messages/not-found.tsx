import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MESSAGES_PATH } from "@/lib/messaging";

export default function ConversationNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <h2 className="text-lg font-semibold">Conversation not found</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        This conversation does not exist, or the asset is no longer available to contact.
      </p>
      <Button asChild variant="outline" className="h-10 rounded-full px-5 md:hidden">
        <Link href={MESSAGES_PATH}>
          <ArrowLeft aria-hidden />
          All conversations
        </Link>
      </Button>
    </div>
  );
}
