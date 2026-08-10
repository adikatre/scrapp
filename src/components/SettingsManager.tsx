"use client";

import { Check, MapPin, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const PROFILE_KEY = "scrapp-service-profile-v1";

type Profile = {
  jurisdictionId: string;
  serviceProfileId: string;
  postalCode: string;
  locale: string;
};

const defaultProfile: Profile = {
  jurisdictionId: "us-ca-san-diego",
  serviceProfileId: "sd-city-serviced-home",
  postalCode: "",
  locale: "en"
};

export function SettingsManager() {
  const [profile, setProfile] = useState(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(PROFILE_KEY);
      if (existing)
        setProfile({ ...defaultProfile, ...(JSON.parse(existing) as Partial<Profile>) });
    } catch {
      setProfile(defaultProfile);
    }
  }, []);

  const save = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-3">
            <MapPin className="size-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Local service</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A curbside answer is definitive only when the jurisdiction and collection service are
            confirmed.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Postal code
              <input
                value={profile.postalCode}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    postalCode: event.target.value.replace(/\D/g, "").slice(0, 5)
                  })
                }
                inputMode="numeric"
                placeholder="92101"
                className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3 font-normal"
              />
            </label>
            <label className="text-sm font-semibold">
              Collection service
              <select
                value={profile.serviceProfileId}
                onChange={(event) =>
                  setProfile({ ...profile, serviceProfileId: event.target.value })
                }
                className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3 font-normal">
                <option value="sd-city-serviced-home">City-serviced home</option>
                <option value="sd-service-unknown">
                  Multifamily, private, or unknown provider
                </option>
              </select>
            </label>
          </div>
          {profile.serviceProfileId === "sd-service-unknown" && (
            <p className="mt-4 rounded-xl bg-secondary p-4 text-sm leading-6">
              Scrapp will withhold City curbside answers until your provider is confirmed. Special
              safety routes can still be shown when sourced citywide.
            </p>
          )}
          <Button onClick={save} className="mt-5">
            {saved ? <Check className="size-4" /> : null}
            {saved ? "Saved" : "Save local profile"}
          </Button>
        </section>

        <section className="border-t border-border/70 pt-8">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Privacy and storage</h2>
          </div>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            History and optional thumbnails stay in this browser. Scrapp does not enable cloud photo
            storage.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/history">Manage local history</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/privacy">Read privacy details</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border/70 pt-8">
          <h2 className="font-display text-xl font-semibold">Language and accessibility</h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            English is the verified interface language in this release. Spanish, Tagalog, and
            Vietnamese require content review before they can be enabled. Theme and reduced motion
            follow your system preferences.
          </p>
        </section>
      </div>

      <aside className="h-fit rounded-[16px] bg-secondary p-5">
        <UserRound className="size-6 text-primary" />
        <h2 className="font-display mt-4 text-xl font-semibold">Optional accounts</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Account sync is not configured on this deployment. Anonymous scanning remains fully
          available.
        </p>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href="/account">Account status</Link>
        </Button>
      </aside>
    </div>
  );
}
