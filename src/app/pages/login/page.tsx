import LoginSignupForm from '@/app/components/LoginSignupForm'
import React from 'react'

const LoginPage: React.FC = () => {
    const onSubmit = (username: string, password: string) => {
        console.log('username', username)
        console.log('password', password)
    }
    return (
        <div className={'mt-2'}>
            <LoginSignupForm onSubmit={onSubmit} />
        </div>
    );
};

export default LoginPage