import * as React from 'react'
import { defineMessages, InjectedIntl, injectIntl } from 'react-intl'

import { Button, IconLink, Input } from 'vtex.styleguide'

import StyleButton from './StyleButton'

interface Props {
  onAdd: (link: string) => void
  intl: InjectedIntl
}

const messages = defineMessages({
  btn: {
    defaultMessage: 'Add',
    id: 'admin/pages.admin.rich-text-editor.add-button',
  },
})

const LinkInput = ({ onAdd, intl }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [link, setLink] = React.useState()

  const handleAddImage = () => {
    setIsOpen(false)
    return onAdd(link)
  }

  return (
    <div className="relative">
      <StyleButton
        active={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        style={null}
        label={<IconLink />}
      />

      {isOpen && (
        <div className="flex flex-column absolute pa5 bg-white b--solid b--muted-4 bw1 br2 w5">
          <div className="mb4">
            <Input
              label={'URL'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLink(e.target.value)
              }
            />
          </div>
          <Button onClick={handleAddImage} size="small">
            {intl.formatMessage(messages.btn)}
          </Button>
        </div>
      )}
    </div>
  )
}

export default injectIntl(LinkInput)
