import { useRouter } from "next/router";

const VERSIONS = ["latest", "v0.5.1", "v0.4.0"];

const semver =
  /^v([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/i;

const VersionSelect = () => {
  const { asPath, query, pathname, basePath, push } = useRouter();
  const version = query.slug?.[0] === "version" ? query.slug?.[1] : "latest";

  return (
    <>
      <pre>
        {JSON.stringify({ asPath, query, pathname, basePath }, null, 2)}
      </pre>
      Version:&nbsp;
      <select
        onChange={(e) => {
          const ver = e.target.value;
          console.log({ ver });
          if (ver === version) return;

          if (ver === "latest" && version !== "latest") {
            const slug = query.slug.slice(2);
            push("/docs/[[...slug]]/", { asPath: "/docs/" + slug.join("/") });
            return;
          }
          // "asPath": "/docs/alternatives",
          // "query": {
          //   "slug": [
          //     "alternatives"
          //   ]
          // },
          // "pathname": "/docs/[[...slug]]",
          if (ver !== "latest") {
            if (query.slug) {
              // clean "version" and "the version"
              const cleanSlug = query.slug.filter(
                (e) => e !== "version" && !semver.test(e)
              );
              const url = `/docs/version/${ver}/${cleanSlug.join("/")}`;
              console.log("pushing: ", url);
              push(url);
            } else {
              const url = `/docs/version/${ver}/`;
              console.log("pushing: ", url);
              push(url);
            }
          }
        }}
        value={version}
      >
        {VERSIONS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </>
  );
};

export default function Layout({ children }) {
  return (
    <>
      <VersionSelect />

      <div className="wrapper">{children}</div>
      <style jsx>{`
        .wrapper {
          max-width: 36rem;
          margin: 0 auto;
          padding: 1.5rem;
        }
      `}</style>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
        }

        :root {
          --site-color: royalblue;
          --divider-color: rgba(0, 0, 0, 0.4);
        }

        html {
          font: 100%/1.5 system-ui;
        }

        a {
          color: inherit;
          text-decoration-color: var(--divider-color);
          text-decoration-thickness: 2px;
        }

        a:hover {
          color: var(--site-color);
          text-decoration-color: currentcolor;
        }

        h1,
        p {
          margin-bottom: 1.5rem;
        }

        code {
          font-family: "Menlo";
        }
      `}</style>
    </>
  );
}
