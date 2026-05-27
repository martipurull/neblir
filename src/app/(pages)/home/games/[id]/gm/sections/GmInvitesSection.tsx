import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { GmSectionTitle } from "./GmSectionTitle";

type PendingInvite = {
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  createdAt: string;
};

type GmInvitesSectionProps = {
  onInviteUsers: () => void;
  pendingInvites: PendingInvite[];
};

export function GmInvitesSection({
  onInviteUsers,
  pendingInvites,
}: GmInvitesSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>Invites</GmSectionTitle>
      <div className="mt-3">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onInviteUsers}
        >
          Invite users
        </Button>
      </div>
      {pendingInvites.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-black/70">Pending invites</p>
          <ul className="mt-2 space-y-2">
            {pendingInvites.map((inv) => (
              <li
                key={inv.invitedUserId}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-black/10 bg-paleBlue/50 px-3 py-2 text-sm text-black"
              >
                <span className="font-medium">{inv.invitedUserName}</span>
                <span className="truncate text-xs text-black/70">
                  {inv.invitedUserEmail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </InfoCard>
  );
}
