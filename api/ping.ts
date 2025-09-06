export const config = { runtime: "edge" };
export default () => new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { "content-type": "application/json" }
});
