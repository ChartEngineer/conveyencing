import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { COLLABORATOR_ROLE_LABELS } from "@/lib/constants";
import { logout } from "@/app/actions/auth";
import AcceptInviteForm from "./accept-invite-form";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [session, invite] = await Promise.all([
    getSession(),
    prisma.matterCollaborator.findUnique({
      where: { inviteToken: token },
      include: { matter: { include: { property: true } }, invitedBy: true },
    }),
  ]);

  const expired = invite ? invite.inviteTokenExpiresAt < new Date() : false;
  const invalid = !invite || invite.status === "REVOKED" || expired;
  const existingUser = invite && !invalid ? await prisma.user.findUnique({ where: { email: invite.email } }) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, var(--navy), var(--navy-2))",
      }}
    >
      <div className="card" style={{ width: 420 }}>
        <div className="flex gap8 mb20" style={{ alignItems: "center" }}>
          <div className="brand-mark" style={{ background: "var(--gold)", color: "var(--navy)" }}>
            D
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18, color: "var(--navy)" }}>Deeds360</div>
            <div className="small muted">Matter collaboration invite</div>
          </div>
        </div>

        {session?.userId ? (
          <div className="small">
            You&apos;re currently signed in as {session.name}. Sign out to accept this invite.
            <form action={logout} className="mt12">
              <button className="btn btn-ghost" type="submit">
                Sign out
              </button>
            </form>
          </div>
        ) : invalid ? (
          <div className="small" style={{ color: "var(--red)" }}>
            This invite link is no longer valid. Ask the firm to send you a new one.
          </div>
        ) : invite.status === "ACCEPTED" ? (
          <div className="small">
            This invite has already been accepted. <a href="/login">Sign in</a> instead.
          </div>
        ) : (
          <>
            <div className="small muted mb16">
              {invite.invitedBy.name} has invited you to collaborate on matter <b>{invite.matter.reference}</b> —{" "}
              {invite.matter.property.standNo}, {invite.matter.property.suburb} as{" "}
              <b>{COLLABORATOR_ROLE_LABELS[invite.role]}</b>. You&apos;ll be able to see the matter&apos;s stage, parties,
              document checklist, and exchange messages with the firm — nothing else.
            </div>
            <AcceptInviteForm token={token} email={invite.email} needsPassword={!existingUser} />
          </>
        )}
      </div>
    </div>
  );
}
