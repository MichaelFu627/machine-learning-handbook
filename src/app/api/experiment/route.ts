export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 12000)
    return Response.json({ error: "Request too large" }, { status: 413 });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const response = await fetch(
      `${process.env.HANDBOOK_API_URL || "http://127.0.0.1:8000"}/v1/experiment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      },
    );
    const result = await response.json();
    return Response.json(result, { status: response.status });
  } catch {
    return Response.json(
      {
        error:
          "The Python computation service is unavailable. Start the API and try again.",
      },
      { status: 503 },
    );
  }
}
