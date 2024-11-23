import React from 'react'
import Button from './shared/Button'
import { FormProvider, useForm } from 'react-hook-form'
import TextInput from './shared/TextInput'

interface FormValues {
    username: string
    password: string
}

interface LoginSignupFormProps {
    onSubmit: (username: string, password: string) => void
}

const LoginSignupForm: React.FC<LoginSignupFormProps> = () => {
    const methods = useForm<FormValues>()

    const onSubmit = (data: FormValues) => {
        console.log(data)
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-md mx-auto mt-10">
                <TextInput name="username" label="username" />
                <TextInput name="password" label="password" />
                <Button type={'submit'} text='login' />
            </form>
        </FormProvider>
    );
};

export default LoginSignupForm;