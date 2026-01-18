"use client";

export default function LogoutButton() {
  return (
    <a
      href="/auth/logout?returnTo=http://localhost:3000"
      className="button logout"
    >
      Log Out
    </a>
  );
}