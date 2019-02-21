import React, { Component } from 'react'
import { compose, graphql, MutationFn } from 'react-apollo'
import { injectIntl } from 'react-intl'
import { IChangeEvent } from 'react-jsonschema-form'
import { Spinner } from 'vtex.styleguide'

import ListContent from '../../../../queries/ListContent.graphql'
import SaveContent from '../../../../queries/SaveContent.graphql'
import {
  getComponentSchema,
  getExtension,
  getIframeImplementation,
  getSchemaPropsOrContent,
  updateExtensionFromForm,
} from '../../../../utils/components'
import { getInterfacePath } from '../../../../utils/interfaces'
import { FormMetaContext, ModalContext } from '../typings'

import ContentEditor from './ContentEditor'
import LayoutEditor from './LayoutEditor'
import List from './List'

const NEW_CONFIGURATION_ID = 'new'

interface ListContentQuery {
  error: object
  listContent: ExtensionConfiguration[]
  loading: boolean
  refetch: (variables?: object) => void
}

interface Props {
  editor: EditorContext
  listContent: ListContentQuery
  iframeRuntime: RenderContext
  intl: ReactIntl.InjectedIntl
  formMeta: FormMetaContext
  modal: ModalContext
  saveContent: MutationFn
}

interface State {
  condition: ExtensionConfiguration['condition']
  configuration?: ExtensionConfiguration
  newLabel?: string
}

class ConfigurationList extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    props.modal.setHandlers({
      actionHandler: this.handleConfigurationSave,
      cancelHandler: this.handleConfigurationDiscard,
    })

    this.state = {
      condition: this.getDefaultCondition(),
    }
  }

  public render() {
    const { editor, formMeta, intl, modal, iframeRuntime } = this.props

    const listContentQuery = this.props.listContent

    const { component, content } = getExtension(
      editor.editTreePath,
      iframeRuntime.extensions
    )

    const componentImplementation = getIframeImplementation(component)

    const componentSchema = getComponentSchema(
      componentImplementation,
      content,
      iframeRuntime,
      intl
    )

    const shouldEnableSaveButton =
      (this.state.configuration &&
        (formMeta.wasModified ||
          this.state.configuration.contentId === NEW_CONFIGURATION_ID)) ||
      false

    if (listContentQuery.loading) {
      return (
        <div className="mt5 flex justify-center">
          <Spinner />
        </div>
      )
    }

    if (editor.mode === 'layout') {
      return (
        <LayoutEditor
          editor={editor}
          formMeta={formMeta}
          iframeRuntime={iframeRuntime}
          modal={modal}
        />
      )
    }

    if (!this.state.configuration) {
      return (
        <List
          configurations={listContentQuery.listContent}
          editor={editor}
          iframeWindow={this.props.editor.iframeWindow}
          isDisabledChecker={this.isConfigurationDisabled}
          onClose={this.handleQuit}
          onCreate={this.handleConfigurationCreation}
          onSelect={this.handleConfigurationOpen}
          title={componentSchema.title}
        />
      )
    }

    const label =
      this.state.newLabel !== undefined
        ? this.state.newLabel
        : this.state.configuration && this.state.configuration.label

    return (
      <ContentEditor
        condition={this.state.condition}
        configuration={this.state.configuration}
        editor={editor}
        iframeRuntime={iframeRuntime}
        isLoading={formMeta.isLoading && !modal.isOpen}
        label={label}
        onClose={
          this.state.configuration
            ? this.handleConfigurationClose
            : this.handleQuit
        }
        onConditionChange={this.handleConditionChange}
        onFormChange={this.handleFormChange}
        onLabelChange={this.handleConfigurationLabelChange}
        onSave={this.handleConfigurationSave}
        shouldDisableSaveButton={!shouldEnableSaveButton}
      />
    )
  }

  private getDefaultCondition = () => ({
    allMatches: true,
    id: '',
    pageContext: this.props.iframeRuntime.route.pageContext,
    statements: [],
  })

  private getDefaultConfiguration = (): ExtensionConfiguration => ({
    condition: this.getDefaultCondition(),
    contentId: NEW_CONFIGURATION_ID,
    contentJSON: '{}',
  })

  private handleConditionChange = (
    changes: Partial<ExtensionConfiguration['condition']>
  ) => {
    this.setState(prevState => ({
      ...prevState,
      condition: {
        ...prevState.condition,
        ...changes,
      },
    }))

    this.props.formMeta.setWasModified(true)
  }

  private handleConfigurationChange = (
    newConfiguration: ExtensionConfiguration
  ) => {
    const { editor, iframeRuntime } = this.props

    const extension = getExtension(
      editor.editTreePath,
      iframeRuntime.extensions
    )

    this.setState(
      {
        condition: newConfiguration.condition,
        configuration: newConfiguration,
      },
      () => {
        iframeRuntime.updateExtension(editor.editTreePath!, {
          ...iframeRuntime.extensions[editor.editTreePath!],
          component: extension.component,
          content:
            newConfiguration.contentId === NEW_CONFIGURATION_ID
              ? extension.content
              : JSON.parse(newConfiguration.contentJSON),
        })
      }
    )
  }

  private handleConfigurationClose = () => {
    const { formMeta, modal } = this.props

    if (formMeta.wasModified) {
      modal.open()
    } else {
      this.setState({ configuration: undefined, newLabel: undefined }, () => {
        if (modal.isOpen) {
          modal.close()
        }
      })
    }
  }

  private handleConfigurationCreation = () => {
    this.handleConfigurationOpen(this.getDefaultConfiguration())
  }

  private handleConfigurationDiscard = () => {
    this.props.formMeta.setWasModified(false, () => {
      this.handleConfigurationClose()
    })
  }

  private handleConfigurationLabelChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      this.setState({ newLabel: event.target.value })

      this.props.formMeta.setWasModified(true)
    }
  }

  private handleConfigurationOpen = (configuration: ExtensionConfiguration) => {
    const { configuration: currConfiguration } = this.state

    if (
      !currConfiguration ||
      currConfiguration.contentId !== configuration.contentId
    ) {
      this.handleConfigurationChange(configuration)
    }

    this.setState({ configuration })
  }

  private handleConfigurationSave = async () => {
    const {
      editor,
      formMeta,
      intl,
      modal,
      iframeRuntime,
      saveContent,
    } = this.props

    const { component, content = {} } = getExtension(
      editor.editTreePath,
      iframeRuntime.extensions
    )

    const componentImplementation = component
      ? getIframeImplementation(component)
      : null

    const pickedContent = getSchemaPropsOrContent(
      componentImplementation,
      content,
      iframeRuntime,
      intl
    )

    const contentId =
      this.state.configuration!.contentId === NEW_CONFIGURATION_ID
        ? null
        : this.state.configuration!.contentId

    const label =
      this.state.newLabel !== undefined
        ? this.state.newLabel
        : this.state.configuration!.label

    const configuration = {
      ...this.state.configuration,
      condition: this.state.condition,
      contentId,
      contentJSON: JSON.stringify(pickedContent),
      label,
    }

    formMeta.toggleLoading()

    try {
      await saveContent({
        variables: {
          configuration,
          interfacePath: getInterfacePath(
            iframeRuntime.extensions,
            editor.editTreePath!
          ),
        },
      })

      const listContentQuery = this.props.listContent

      await listContentQuery.refetch({
        interfacePath: getInterfacePath(
          iframeRuntime.extensions,
          editor.editTreePath!
        ),
        pageContext: iframeRuntime.route.pageContext,
      })

      formMeta.toggleLoading(this.handleConfigurationDiscard)
    } catch (err) {
      formMeta.toggleLoading(() => {
        if (modal.isOpen) {
          modal.close()
        }

        alert('Something went wrong. Please try again.')

        console.log(err)
      })
    }
  }

  private handleFormChange = (event: IChangeEvent) => {
    const {
      formMeta,
      intl,
      iframeRuntime,
      editor: { editTreePath },
    } = this.props

    if (!formMeta.wasModified) {
      formMeta.setWasModified(true)
    }

    updateExtensionFromForm(editTreePath, event, intl, iframeRuntime, true)
  }

  private handleQuit = (event?: any) => {
    const { editor, iframeRuntime } = this.props

    if (event) {
      event.stopPropagation()
    }

    iframeRuntime.updateRuntime({
      conditions: editor.activeConditions,
    })

    editor.editExtensionPoint(null)
  }

  private isConfigurationDisabled = (configuration: ExtensionConfiguration) => {
    const configurationPageContext = configuration.condition.pageContext

    const iframeRuntimePageContext = this.props.iframeRuntime.route.pageContext

    if (configurationPageContext.type === '*') {
      return false
    }

    if (configurationPageContext.type !== iframeRuntimePageContext.type) {
      return true
    }

    if (configurationPageContext.id === '*') {
      return false
    }

    return configurationPageContext.id !== iframeRuntimePageContext.id
  }
}

export default compose(
  injectIntl,
  graphql(ListContent, {
    name: 'listContent',
    options: ({ editor, iframeRuntime }: Props) => ({
      variables: {
        interfacePath: getInterfacePath(
          iframeRuntime.extensions,
          editor.editTreePath!
        ),
        pageContext: iframeRuntime.route.pageContext,
      },
    }),
  }),
  graphql(SaveContent, { name: 'saveContent' })
)(ConfigurationList)
