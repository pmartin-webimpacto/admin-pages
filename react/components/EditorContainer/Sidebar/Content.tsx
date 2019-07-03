import myvtexSSE from 'myvtex-sse'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRuntime } from 'vtex.render-runtime'
import { Spinner, ToastConsumer } from 'vtex.styleguide'

import { getSitewideTreePath } from '../../../utils/blocks'
import { getIframeRenderComponents } from '../../../utils/components'

import { useEditorContext } from '../../EditorContext'
import DeleteContentMutation from '../mutations/DeleteContent'
import SaveContentMutation from '../mutations/SaveContent'
import ListContentQuery from '../queries/ListContent'

import ComponentSelector from './ComponentSelector'
import ConfigurationList from './ConfigurationList'
import { useFormMetaContext } from './FormMetaContext'
import { useModalContext } from './ModalContext'
import { getComponents, getIsSitewide } from './utils'

interface Props {
  highlightHandler: (treePath: string | null) => void
  iframeRuntime: RenderContext
}

const getInitialComponents = (props: Props) =>
  getComponents(
    props.iframeRuntime.extensions,
    getIframeRenderComponents(),
    props.iframeRuntime.page
  )

const Content = (props: Props) => {
  const { highlightHandler, iframeRuntime } = props

  const editor = useEditorContext()
  const formMeta = useFormMetaContext()
  const modal = useModalContext()
  const runtime = useRuntime()

  const initialComponents = useMemo(() => getInitialComponents(props), [])

  const [components, setComponents] = useState(initialComponents)

  const path = useRef('')

  useEffect(
    () => {
      if (path.current !== iframeRuntime.route.path) {
        setComponents(getInitialComponents(props))
        editor.setIsLoading(false)
        path.current = iframeRuntime.route.path
      }
    },
    [iframeRuntime.route.path]
  )

  useEffect(() => {
    const pathSSE = `vtex.pages-graphql:*:teste?workspace=${runtime.workspace}`
    const eventSource = myvtexSSE(
      runtime.account,
      runtime.workspace,
      pathSSE,
      {}
    )
    eventSource.onopen = () =>
      console.log('[pages] Connected to event server successfully')
    eventSource.onerror = () =>
      console.log('[pages] Connection to event server failed')

    const handler = ({ data }: MessageEvent) => {
      const event = JSON.parse(data)
      const {
        key,
        body: { code, type, hash, locales, subject },
      } = event

      console.log(data)

      iframeRuntime.updateRuntime()
    }
    eventSource.onmessage = handler

    return function eventCleanUp() {
      eventSource.close()
    }
  }, [])

  if (editor.editTreePath === null) {
    return (
      <ComponentSelector
        components={components}
        highlightHandler={highlightHandler}
        iframeRuntime={iframeRuntime}
        updateSidebarComponents={setComponents}
      />
    )
  }

  const isSitewide = getIsSitewide(
    iframeRuntime.extensions,
    editor.editTreePath
  )

  const template = isSitewide
    ? '*'
    : iframeRuntime.pages[iframeRuntime.page].blockId

  const treePath = isSitewide
    ? getSitewideTreePath(editor.editTreePath)
    : editor.editTreePath!

  return (
    <ToastConsumer>
      {({ showToast }) => (
        <ListContentQuery
          variables={{
            blockId: iframeRuntime.extensions[editor.editTreePath!].blockId,
            pageContext: iframeRuntime.route.pageContext,
            template,
            treePath,
          }}
        >
          {({ data, loading, refetch }) => (
            <SaveContentMutation>
              {saveContent => (
                <DeleteContentMutation>
                  {deleteContent =>
                    loading ? (
                      <div className="mt9 flex justify-center">
                        <Spinner />
                      </div>
                    ) : (
                      <ConfigurationList
                        deleteContent={deleteContent}
                        editor={editor}
                        formMeta={formMeta}
                        iframeRuntime={iframeRuntime}
                        isSitewide={isSitewide}
                        modal={modal}
                        queryData={data}
                        refetch={refetch}
                        saveContent={saveContent}
                        showToast={showToast}
                        template={template}
                        treePath={treePath}
                      />
                    )
                  }
                </DeleteContentMutation>
              )}
            </SaveContentMutation>
          )}
        </ListContentQuery>
      )}
    </ToastConsumer>
  )
}

export default Content
