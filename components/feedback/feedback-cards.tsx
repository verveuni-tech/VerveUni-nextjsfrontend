import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function FeedbackList({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: string
  items: string[]
  emptyLabel: string
  tone: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`text-base ${tone}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-1.5">
            {items.map((item, index) => (
              <li key={`${item}-${index}`} className="text-sm text-muted-foreground">
                - {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function FeedbackCards({
  strengths,
  slowdowns,
  nextFocus,
}: {
  strengths: string[]
  slowdowns: string[]
  nextFocus: string[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FeedbackList
        title="Strengths"
        items={strengths}
        emptyLabel="No strengths data yet"
        tone="text-green-600"
      />
      <FeedbackList
        title="Areas to Improve"
        items={slowdowns}
        emptyLabel="No improvement data yet"
        tone="text-orange-600"
      />
      <FeedbackList
        title="Next Focus"
        items={nextFocus}
        emptyLabel="Keep practicing!"
        tone="text-blue-600"
      />
    </div>
  )
}
