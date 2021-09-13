import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import { useRouter } from "next/router";
import fs from "fs";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import Link from "next/link";
import path from "path";
import Layout from "../../components/Layout";
import { docsFilePaths, DOCS_PATH } from "../../utils/mdxUtils";
import { SerializeOptions } from "next-mdx-remote/dist/types";

import fetchFile from "../../data/fetchFile";

const mdxOptions: SerializeOptions["mdxOptions"] = {
  remarkPlugins: [],
  rehypePlugins: [],
};
export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  console.log(params);
  let version = "latest";
  let slug = (params.slug ?? null) as string[] | null;

  // handle root docs page
  if (!slug) {
    const postFilePath = path.join(DOCS_PATH, `index.md`);
    const source = fs.readFileSync(postFilePath);
    const { content, data } = matter(source);
    const mdxSource = await serialize(content, {
      // Optionally pass remark/rehype plugins
      mdxOptions,
      scope: data,
    });

    return {
      props: {
        slug,
        isVersioned: false,
        tag: null,
        source: mdxSource,
        frontMatter: data,
      },
      notFound: !source,
    };
  }

  const isRemote = slug[0] === "version";
  if (isRemote) {
    console.log("IS REMOTE!");
    await new Promise((r) => setTimeout(r, 0));

    const version = slug[1];
    slug = slug.slice(2);
    const expression = `${version}:website/content/docs/${slug.join("/")}.mdx`;
    console.log({ expression });

    const remoteSource = await fetchFile({
      owner: "hashicorp",
      name: "waypoint",
      expression: expression,
    });

    console.warn(remoteSource.rateLimit);

    let { content, data } = matter(
      remoteSource.repository?.object?.text || "NOTHING FOUND..."
    );

    // sanitize
    const COMMANDS = `(/commands/version/${version}/`;
    const DOCS = `(/docs/version/${version}/`;
    const PLUGINS = `(/plugins/version/${version}/`;
    content = content.replace(/\(\/commands\//g, COMMANDS);
    content = content.replace(/\(commands\//g, COMMANDS);
    content = content.replace(/\(\/docs\//g, DOCS);
    content = content.replace(/\(docs\//g, DOCS);
    content = content.replace(/\(\/plugins\//g, PLUGINS);
    content = content.replace(/\(plugins\//g, PLUGINS);

    console.log(content);

    const source = await serialize(content, {
      // Optionally pass remark/rehype plugins
      mdxOptions,
      scope: {},
    });

    return {
      props: {
        slug,
        isRemote,
        version,
        source: source,
        frontMatter: data,
      },
      notFound: !remoteSource,
    };
  }

  const postFilePath = path.join(DOCS_PATH, `${slug.join("/")}.md`);

  let source;
  try {
    source = fs.readFileSync(postFilePath);
  } catch (err) {
    return {
      notFound: true,
    };
  }

  const { content, data } = matter(source);

  const mdxSource = await serialize(content, {
    // Optionally pass remark/rehype plugins
    mdxOptions,
    scope: data,
  });

  return {
    props: {
      slug,
      isRemote,
      version,
      source: mdxSource,
      frontMatter: data,
    },
  };
};

// Only generates static paths, available via file system
export const getStaticPaths: GetStaticPaths = async () => {
  const paths = docsFilePaths
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, "").replace(/\.rst$/, ""))
    // Map the path into the static paths object required by Next.js
    .map((slug) => ({ params: { slug: [slug] } }))
    .concat({ params: { slug: null } });
  return {
    paths,
    fallback: true,
  };
};

type Props = InferGetStaticPropsType<typeof getStaticProps>;
// https://nextjs.org/docs/tag/v9.2.2

const DocsPage: NextPage<Props> = ({
  slug,
  isRemote,
  version,
  source,
  frontMatter,
}) => {
  const { isFallback } = useRouter();
  return (
    <Layout>
      <header>
        <nav>
          <Link href="/">
            <a>👈 Go back home</a>
          </Link>
        </nav>
        <ul>
          <li>slug: {slug?.join(" / ")}</li>
          <li>isRemote: {isRemote ? "Yes" : "No"}</li>
          <li>version: {version}</li>
          <li>isFallback: {isFallback ? "Yes" : "No"}</li>
        </ul>
      </header>
      {isFallback ? (
        <>Fallback</>
      ) : (
        <>
          <div className="post-header">
            <h1>{frontMatter.title}</h1>
            {frontMatter.description && (
              <p className="description">{frontMatter.description}</p>
            )}
          </div>
          <main>
            <MDXRemote {...source} components={{}} />
          </main>
        </>
      )}

      <style jsx>{`
        .post-header h1 {
          margin-bottom: 0;
        }

        .post-header {
          margin-bottom: 2rem;
        }
        .description {
          opacity: 0.6;
        }
      `}</style>
    </Layout>
  );
};

export default DocsPage;
