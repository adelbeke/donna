import type {CheckRunContext, StatusContextItem} from "@/types/github.ts";
import {PRCheckIcon} from "@/features/pull-requests/components/PRChecksModal/PRCheckIcon.tsx";
import {ExternalLink} from "lucide-react";
import type {PropsWithChildren} from "react";
import {twMerge} from "tailwind-merge";

interface Props {
    check: CheckRunContext | StatusContextItem
}

const CLASSNAME = 'group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-overlay)]'

const Wrapper = ({children, url}: {children: PropsWithChildren['children'],  url: string | null}) => {
    return url ? (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={twMerge(CLASSNAME, 'cursor-pointer')}
        >
            {children}
        </a>
    ) : <div className={CLASSNAME}>{children}</div>
}

export function PRCheckRow({check}: Props) {
    const name = check.__typename === 'CheckRun' ? check.name : check.context
    const url = check.__typename === 'CheckRun' ? check.detailsUrl : check.targetUrl

    return (
        <Wrapper url={url}>
            <PRCheckIcon check={check} />
            <span className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] flex-1 truncate">
                {name}
              </span>
            {url && (<ExternalLink size={11} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" />)}
        </Wrapper>
    )
}