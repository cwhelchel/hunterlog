import React, { ReactNode } from 'react';
import { HlModal, HlModalContent, HlStyledBackdrop } from './Modals';
import { SxProps } from '@mui/material';

// Define the component's specific props
interface HlModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    contentWidth?: string; // css width for modal content
    title: string; // modal title
    id: string; //css id
    contentStyle: SxProps;
}

const HlModal2: React.FC<HlModalProps> = ({
    children,
    isOpen,
    onClose,
    title,
    id,
    contentStyle
}) => {
    const titleId = id + "-hlmodal-title";
    const modalId = id + "-hlmodal";

    return (
        <HlModal
            id={modalId}
            className="hl-modal"
            aria-labelledby={titleId}
            open={isOpen}
            onClose={onClose}
            slots={{ backdrop: HlStyledBackdrop }}
            sx={{ overflowY: 'scroll' }}
        >

            <HlModalContent sx={contentStyle}>
                {title != '' && (
                    <h2 id={titleId} className="hl-modal-title" style={{ display: 'flex' }}>
                        {title}
                    </h2>
                )}
                {children}
            </HlModalContent>
        </HlModal>
    );
};

export default HlModal2