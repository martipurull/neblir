import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import {
  formatDamageTypeList,
  formatEnemyActionCombatLine,
  formatSignedModifier,
  type EnemyDetailsAction,
  type EnemyDetailsModel,
} from "@/app/lib/enemyDetailsView";

type EnemyDetailsVariant = "dark" | "light";

type EnemyDetailsViewProps = {
  details: EnemyDetailsModel;
  variant?: EnemyDetailsVariant;
  showCombatStats?: boolean;
  showActions?: boolean;
};

type VariantClasses = {
  section: string;
  heading: string;
  label: string;
  body: string;
  muted: string;
  actionCard: string;
  richText: string;
  notes: string;
};

const VARIANT_CLASSES: Record<EnemyDetailsVariant, VariantClasses> = {
  dark: {
    section: "space-y-1",
    heading: "text-xs uppercase tracking-wide text-white/65",
    label: "text-xs uppercase tracking-wide text-white/65",
    body: "text-sm text-white/90",
    muted: "text-sm text-white/70",
    actionCard: "rounded border border-white/15 p-3",
    richText: "text-sm text-white/90",
    notes: "whitespace-pre-wrap text-sm text-white/80",
  },
  light: {
    section: "rounded border border-black/20 p-4",
    heading: "text-sm font-semibold text-black",
    label: "text-xs uppercase tracking-wide text-black/55",
    body: "text-sm text-black/90",
    muted: "text-sm text-black/70",
    actionCard: "rounded border border-black/10 p-3",
    richText: "text-sm text-black/85",
    notes: "whitespace-pre-wrap text-sm text-black/80",
  },
};

function EnemyRichTextBlock({
  title,
  content,
  classes,
}: {
  title: string;
  content?: string | null;
  classes: VariantClasses;
}) {
  if (!content) return null;
  return (
    <section className={classes.section}>
      <h3 className={classes.heading}>{title}</h3>
      <StoredRichTextHtml content={content} className={classes.richText} />
    </section>
  );
}

function EnemyTraitRow({
  title,
  values,
  classes,
}: {
  title: string;
  values: readonly string[];
  classes: VariantClasses;
}) {
  return (
    <p className={classes.body}>
      <span className="font-semibold">{title}:</span>{" "}
      {formatDamageTypeList(values)}
    </p>
  );
}

function EnemyActionReadOnlyList({
  title,
  emptyMessage,
  actions,
  classes,
}: {
  title: string;
  emptyMessage: string;
  actions: EnemyDetailsAction[];
  classes: VariantClasses;
}) {
  return (
    <section className={classes.section}>
      <h3 className={classes.heading}>{title}</h3>
      {actions.length === 0 ? (
        <p className={`mt-2 ${classes.muted}`}>{emptyMessage}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {actions.map((action, idx) => {
            const combatLine = formatEnemyActionCombatLine(action);
            return (
              <li key={`${action.name}-${idx}`} className={classes.actionCard}>
                <p className={`font-medium ${classes.body}`}>{action.name}</p>
                {action.description ? (
                  <StoredRichTextHtml
                    content={action.description}
                    className={`mt-1 ${classes.richText}`}
                  />
                ) : null}
                {combatLine ? (
                  <p className={`mt-1 tabular-nums ${classes.muted}`}>
                    {combatLine}
                  </p>
                ) : null}
                {action.notes ? (
                  <p className={`mt-1 ${classes.notes}`}>{action.notes}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function EnemyDetailsView({
  details,
  variant = "dark",
  showCombatStats = true,
  showActions = true,
}: EnemyDetailsViewProps) {
  const classes = VARIANT_CLASSES[variant];

  return (
    <div className="space-y-4">
      <EnemyRichTextBlock
        title="Description"
        content={details.description}
        classes={classes}
      />
      <EnemyRichTextBlock
        title="Notes"
        content={details.notes}
        classes={classes}
      />

      {showCombatStats ? (
        <section className={classes.section}>
          <h3 className={classes.heading}>Stats</h3>
          <div className={`mt-1 space-y-1 tabular-nums ${classes.body}`}>
            <p>
              HP {details.health} · Speed {details.speed} · Init{" "}
              {formatSignedModifier(details.initiativeModifier)} · Reactions{" "}
              {details.reactions}
            </p>
            <p>
              Defence: melee {details.defenceMelee} · range{" "}
              {details.defenceRange} · grid {details.defenceGrid}
            </p>
            <p>
              Attack: melee {details.attackMelee} · range {details.attackRange}{" "}
              · throw {details.attackThrow} · grid {details.attackGrid}
            </p>
          </div>
        </section>
      ) : null}

      <section className={classes.section}>
        <h3 className={classes.heading}>
          Immunities, resistances &amp; vulnerabilities
        </h3>
        <div className="mt-1 space-y-1">
          <EnemyTraitRow
            title="Immunities"
            values={details.immunities}
            classes={classes}
          />
          <EnemyTraitRow
            title="Resistances"
            values={details.resistances}
            classes={classes}
          />
          <EnemyTraitRow
            title="Vulnerabilities"
            values={details.vulnerabilities}
            classes={classes}
          />
        </div>
      </section>

      {showActions ? (
        <>
          <EnemyActionReadOnlyList
            title="Actions"
            emptyMessage="No actions."
            actions={details.actions}
            classes={classes}
          />
          <EnemyActionReadOnlyList
            title="Additional actions"
            emptyMessage="No additional actions."
            actions={details.additionalActions}
            classes={classes}
          />
        </>
      ) : null}
    </div>
  );
}
