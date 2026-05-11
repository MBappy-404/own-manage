export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/income/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/leaderboard/:path*",
    "/insights/:path*",
    "/savings/:path*",
    "/settings/:path*",
  ],
};
