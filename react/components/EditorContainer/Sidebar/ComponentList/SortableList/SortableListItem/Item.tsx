import classnames from 'classnames'
import React from 'react'
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl'
import { formatIOMessage } from 'vtex.native-types'

interface Props extends InjectedIntlProps {
  hasSubItems?: boolean
  isSortable?: boolean
  isChild?: boolean
  onEdit: (event: React.MouseEvent<HTMLDivElement>) => void
  onMouseEnter: (event: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave: (event: React.MouseEvent<HTMLDivElement>) => void
  title: string
  treePath: string
}

const messages = defineMessages({
  untitledBlock: {
    defaultMessage: 'Untitled Block',
    id: 'admin/pages.editor.component-list.untitled',
  },
})

const Item: React.FunctionComponent<Props> = ({
  hasSubItems,
  intl,
  isSortable,
  isChild,
  onEdit,
  onMouseEnter,
  onMouseLeave,
  title,
  treePath,
}) => {
  let leftPaddingClassName = 'pl8'

  const marginStyle = isSortable
    ? hasSubItems
      ? { marginLeft: 1 }
      : { marginLeft: 5 }
    : null

  if ((isSortable && !hasSubItems) || isChild) {
    leftPaddingClassName = 'pl5'
  } else if (isSortable) {
    leftPaddingClassName = 'pl2'
  } else if (hasSubItems) {
    leftPaddingClassName = 'pl3'
  }

  return (
    <div
      className={classnames(
        'w-100 pv5 pr0 dark-gray bg-inherit tl',
        leftPaddingClassName
      )}
      data-tree-path={treePath}
      key={treePath}
      onClick={onEdit}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...{ animationDuration: '0.2s' },
        ...marginStyle,
      }}
    >
      <span className={`f6 fw4 track-1 ${isChild ? 'pl7' : 'pl2'}`}>
        {typeof title === 'string' ? (
          formatIOMessage({ id: title, intl })
        ) : (
          <i>{intl.formatMessage(messages.untitledBlock)}</i>
        )}
      </span>
    </div>
  )
}

export default injectIntl(Item)
